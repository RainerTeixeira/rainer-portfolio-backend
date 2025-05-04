/* ====================================================================
   src/modules/blog/category/category.service.ts
   ==================================================================== */
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';

import { BaseCategoryDto } from './dto/base-category.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import { generateId } from '@src/common/utils/generate-id';
import { formatDate } from '@src/common/utils/format-date';

// Se não quiser importar do SDK, use 'any' para AttributeValue
import { AttributeValue } from '@aws-sdk/client-dynamodb';

interface CategoryDynamoItem {
    'CATEGORY#id': string;
    'METADATA': string;
    created_at: number;
    updated_at: number;
    name: string;
    slug: string;
    description?: string;
    meta_description?: string;
    post_count?: number;
    keywords?: string[];
    type: string;
}

function fromDynamo(item: Record<string, AttributeValue>): CategoryDynamoItem {
    return {
        'CATEGORY#id': item['CATEGORY#id']?.S,
        'METADATA': item['METADATA']?.S,
        created_at: item['created_at'] ? Number(item['created_at'].N) : 0,
        updated_at: item['updated_at'] ? Number(item['updated_at'].N) : 0,
        name: item['name']?.S,
        slug: item['slug']?.S,
        description: item['description']?.S,
        meta_description: item['meta_description']?.S,
        post_count: item['post_count'] ? Number(item['post_count'].N) : 0,
        keywords: item['keywords']?.L ? item['keywords'].L.map((k: any) => k.S) : [],
        type: item['type']?.S,
    };
}

@Injectable()
export class CategoryService {
    private readonly tableName = 'Category';

    constructor(private readonly dynamo: DynamoDbService) { }

    async create(dto: CreateCategoryDto): Promise<BaseCategoryDto> {
        // Gera ID automático
        const rawId = generateId();
        const id = rawId;
        const now = new Date();
        const nowStr = formatDate(now);

        // Monta item em formato AttributeValue
        const item = {
            'CATEGORY#id': id,
            METADATA: 'METADATA',
            created_at: nowStr,
            updated_at: nowStr,
            name: dto.name,
            slug: dto.slug ?? rawId,
            description: dto.description ?? '',
            meta_description: dto.meta_description ?? '',
            post_count: 0,
            type: 'CATEGORY',
            keywords: dto.keywords ?? [],

        };

        try {
            await this.dynamo.put({ TableName: this.tableName, Item: item });
        } catch (err) {
            throw new InternalServerErrorException('Falha ao criar categoria', { cause: err });
        }

        // Retorna DTO
        return {
            'CATEGORY#id': id,
            METADATA: 'METADATA',
            created_at: nowStr,
            updated_at: nowStr,
            name: dto.name,
            slug: dto.slug ?? rawId,
            description: dto.description,
            meta_description: dto.meta_description,
            post_count: 0,
            type: 'CATEGORY',
            keywords: dto.keywords ?? [],
        } as BaseCategoryDto;
    }

    private map(item: CategoryDynamoItem | Record<string, AttributeValue>): BaseCategoryDto {
        let data: CategoryDynamoItem;
        if ((item as Record<string, AttributeValue>)['CATEGORY#id']?.S) {
            data = fromDynamo(item as Record<string, AttributeValue>);
        } else {
            data = item as CategoryDynamoItem;
        }
        return {
            'CATEGORY#id': data['CATEGORY#id'],
            METADATA: data.METADATA,
            created_at: data.created_at,
            updated_at: data.updated_at,
            name: data.name,
            slug: data.slug,
            description: data.description,
            meta_description: data.meta_description,
            post_count: data.post_count ?? 0,
            type: data.type,
            keywords: data.keywords ?? [],
        } as BaseCategoryDto;
    }

    async findOne(id: string): Promise<BaseCategoryDto> {
        const key = {
            'CATEGORY#id': id, // Usa o id puro
            'METADATA': 'METADATA',
        };
        try {
            const { data } = await this.dynamo.get({ TableName: this.tableName, Key: key });
            const item = (data as { Item?: CategoryDynamoItem }).Item;
            if (!item) throw new NotFoundException(`Category ${id} not found`);
            return this.map(item);
        } catch (err) {
            throw new InternalServerErrorException('Falha na operação get', { cause: err });
        }
    }

    async findBySlug(slug: string): Promise<BaseCategoryDto> {
        const { data } = await this.dynamo.query({
            TableName: this.tableName,
            IndexName: 'GSI_Slug',
            KeyConditionExpression: '#slug = :slug AND #type = :type',
            ExpressionAttributeNames: {
                '#slug': 'slug',
                '#type': 'type',
            },
            ExpressionAttributeValues: {
                ':slug': slug,
                ':type': 'CATEGORY',
            },
            Limit: 1,
        });
        const items = (data as { Items?: CategoryDynamoItem[] }).Items || [];
        if (!items.length) throw new NotFoundException(`Category with slug "${slug}" not found`);
        return this.map(items[0]);
    }

    async update(id: string, dto: UpdateCategoryDto): Promise<BaseCategoryDto> {
        await this.findOne(id);
        const updates: string[] = [];
        const exprNames: Record<string, string> = {};
        const exprValues: Record<string, unknown> = {};

        Object.entries(dto).forEach(([key, value], idx) => {
            const attr = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            const nameKey = `#f${idx}`;
            const valKey = `:v${idx}`;
            updates.push(`${nameKey} = ${valKey}`);
            exprNames[nameKey] = attr;
            exprValues[valKey] = value;
        });
        // always update updated_at
        const nowKey = Object.keys(exprValues).length;
        updates.push(`#f${nowKey} = :v${nowKey}`);
        exprNames[`#f${nowKey}`] = 'updated_at';
        exprValues[`:v${nowKey}`] = formatDate(new Date());

        const key = {
            'CATEGORY#id': id, // Usa o id puro
            'METADATA': 'METADATA',
        };

        const { data } = await this.dynamo.update({
            TableName: this.tableName,
            Key: key,
            UpdateExpression: 'SET ' + updates.join(', '),
            ExpressionAttributeNames: exprNames,
            ExpressionAttributeValues: exprValues,
            ReturnValues: 'ALL_NEW',
        });

        return this.map((data as { Attributes: CategoryDynamoItem }).Attributes);
    }

    async remove(id: string): Promise<void> {
        const key = {
            'CATEGORY#id': id, // Usa o id puro
            'METADATA': 'METADATA',
        };
        await this.dynamo.delete({ TableName: this.tableName, Key: key });
    }

    async listPopular(limit = 10): Promise<BaseCategoryDto[]> {
        const { data } = await this.dynamo.query({
            TableName: this.tableName,
            IndexName: 'GSI_Popular',
            KeyConditionExpression: '#type = :type',
            ExpressionAttributeNames: { '#type': 'type' },
            ExpressionAttributeValues: { ':type': 'CATEGORY' },
            ScanIndexForward: false,
            Limit: limit,
        });
        const items = (data as { Items?: CategoryDynamoItem[] }).Items || [];
        return items.map(item => this.map(item));
    }
}
