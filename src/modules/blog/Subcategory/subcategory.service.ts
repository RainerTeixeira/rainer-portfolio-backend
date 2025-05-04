// subcategory.service.ts
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { AttributeValue } from '@aws-sdk/client-dynamodb';

import { BaseSubcategoryDto } from './dto/base-subcategory.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';

import { generateId } from '@src/common/utils/generate-id';
import { formatDate } from '@src/common/utils/format-date';

/**
 * Interface que representa o item de subcategoria armazenado no DynamoDB.
 * Cada campo corresponde a um atributo da tabela.
 */
interface SubcategoryDynamoItem {
    'SUBCAT#id': string;
    METADATA: string;
    created_at: number;
    updated_at: number;
    name: string;
    slug: string;
    description?: string;
    meta_description?: string;
    post_count?: number;
    parent_category_id: string;
    parent_category_slug: string;
    type: string;
}

/**
 * Função utilitária para converter um item retornado do DynamoDB (formato AttributeValue)
 * para o formato tipado SubcategoryDynamoItem.
 * 
 * @param item - Item retornado do DynamoDB.
 * @returns SubcategoryDynamoItem - Objeto tipado com os campos da subcategoria.
 */
function fromDynamo(item: Record<string, AttributeValue>): SubcategoryDynamoItem {
    return {
        'SUBCAT#id': item['SUBCAT#id']?.S,
        METADATA: item['METADATA']?.S,
        created_at: item['created_at'] ? Number(item['created_at'].N) : 0,
        updated_at: item['updated_at'] ? Number(item['updated_at'].N) : 0,
        name: item['name']?.S,
        slug: item['slug']?.S,
        description: item['description']?.S,
        meta_description: item['meta_description']?.S,
        post_count: item['post_count'] ? Number(item['post_count'].N) : 0,
        parent_category_id: item['parent_category_id']?.S,
        parent_category_slug: item['parent_category_slug']?.S,
        type: item['type']?.S,
    };
}

/**
 * Serviço responsável por gerenciar as operações relacionadas à entidade Subcategory.
 * 
 * Este serviço encapsula toda a lógica de acesso e manipulação de dados de subcategorias,
 * utilizando o DynamoDbService para persistência e consulta na tabela DynamoDB.
 * 
 * Principais responsabilidades:
 * - Criar novas subcategorias.
 * - Buscar subcategorias por ID, slug ou categoria-pai.
 * - Atualizar dados de subcategorias existentes.
 * - Remover subcategorias.
 * 
 * Observações:
 * - O método `map` converte itens do DynamoDB para o formato BaseSubcategoryDto.
 * - Todos os métodos lançam exceções apropriadas em caso de erro, facilitando o tratamento no controller.
 * - O serviço é injetável e pode ser utilizado em outros módulos do NestJS.
 */
@Injectable()
export class SubcategoryService {
    private readonly tableName = 'Subcategory';

    /**
     * Injeta o serviço de acesso ao DynamoDB.
     * @param dynamo Serviço responsável pelas operações no DynamoDB.
     */
    constructor(private readonly dynamo: DynamoDbService) { }

    /**
     * Cria uma nova subcategoria na tabela do DynamoDB.
     * 
     * @param dto Dados para criação da subcategoria.
     * @returns BaseSubcategoryDto - Dados da subcategoria criada.
     * @throws InternalServerErrorException em caso de falha na operação.
     */
    async create(dto: CreateSubcategoryDto): Promise<BaseSubcategoryDto> {
        const rawId = generateId();
        const id = rawId;
        const now = new Date();
        const nowStr = formatDate(now);

        const item = {
            'SUBCAT#id': id,
            METADATA: 'METADATA',
            created_at: nowStr,
            updated_at: nowStr,
            name: dto.name,
            slug: dto.slug ?? rawId,
            description: dto.description ?? '',
            meta_description: dto.meta_description ?? '',
            post_count: 0,
            parent_category_id: dto.parent_category_id,
            parent_category_slug: dto.parent_category_slug,
            type: 'SUBCATEGORY',
        };

        try {
            await this.dynamo.put({ TableName: this.tableName, Item: item });
        } catch (err) {
            throw new InternalServerErrorException('Falha ao criar subcategoria', { cause: err });
        }

        return {
            'SUBCAT#id': id,
            METADATA: 'METADATA',
            created_at: nowStr,
            updated_at: nowStr,
            name: dto.name,
            slug: dto.slug ?? rawId,
            description: dto.description,
            meta_description: dto.meta_description,
            post_count: 0,
            parent_category_id: dto.parent_category_id,
            parent_category_slug: dto.parent_category_slug,
            type: 'SUBCATEGORY',
        } as BaseSubcategoryDto;
    }

    /**
     * Converte um item do DynamoDB para o formato BaseSubcategoryDto.
     * 
     * @param item Item da subcategoria (pode ser do DynamoDB ou já tipado).
     * @returns BaseSubcategoryDto - Objeto de transferência de dados da subcategoria.
     */
    private map(item: SubcategoryDynamoItem | Record<string, AttributeValue>): BaseSubcategoryDto {
        let data: SubcategoryDynamoItem;
        if ((item as Record<string, AttributeValue>)['SUBCAT#id']?.S) {
            data = fromDynamo(item as Record<string, AttributeValue>);
        } else {
            data = item as SubcategoryDynamoItem;
        }

        return {
            'SUBCAT#id': data['SUBCAT#id'],
            METADATA: data.METADATA,
            created_at: data.created_at,
            updated_at: data.updated_at,
            name: data.name,
            slug: data.slug,
            description: data.description,
            meta_description: data.meta_description,
            post_count: data.post_count ?? 0,
            parent_category_id: data.parent_category_id,
            parent_category_slug: data.parent_category_slug,
            type: data.type,
        } as BaseSubcategoryDto;
    }

    /**
     * Busca uma subcategoria pelo seu ID.
     * 
     * @param id Identificador da subcategoria.
     * @returns BaseSubcategoryDto - Dados da subcategoria encontrada.
     * @throws NotFoundException se a subcategoria não for encontrada.
     * @throws InternalServerErrorException em caso de falha na operação.
     */
    async findById(id: string): Promise<BaseSubcategoryDto> {
        const key = {
            'SUBCAT#id': id,
            METADATA: 'METADATA',
        };
        try {
            const { data } = await this.dynamo.get({ TableName: this.tableName, Key: key });
            const item = (data as { Item?: SubcategoryDynamoItem }).Item;
            if (!item) throw new NotFoundException(`Subcategory ${id} not found`);
            return this.map(item);
        } catch (err) {
            throw new InternalServerErrorException('Falha na operação get', { cause: err });
        }
    }

    /**
     * Busca uma subcategoria pelo seu slug.
     * 
     * @param slug Slug da subcategoria.
     * @returns BaseSubcategoryDto - Dados da subcategoria encontrada.
     * @throws NotFoundException se a subcategoria não for encontrada.
     */
    async findBySlug(slug: string): Promise<BaseSubcategoryDto> {
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
                ':type': 'SUBCATEGORY',
            },
            Limit: 1,
        });
        const items = (data as { Items?: SubcategoryDynamoItem[] }).Items || [];
        if (!items.length) throw new NotFoundException(`Subcategory with slug "${slug}" not found`);
        return this.map(items[0]);
    }

    /**
     * Busca todas as subcategorias de uma categoria-pai.
     * 
     * @param parentCategoryId ID da categoria-pai.
     * @returns BaseSubcategoryDto[] - Lista de subcategorias pertencentes à categoria-pai.
     */
    async findByParentCategory(parentCategoryId: string): Promise<BaseSubcategoryDto[]> {
        const { data } = await this.dynamo.query({
            TableName: this.tableName,
            IndexName: 'GSI_ParentCategory',
            KeyConditionExpression: '#parent = :parent AND #type = :type',
            ExpressionAttributeNames: {
                '#parent': 'parent_category_id',
                '#type': 'type',
            },
            ExpressionAttributeValues: {
                ':parent': parentCategoryId,
                ':type': 'SUBCATEGORY',
            },
        });
        const items = (data as { Items?: SubcategoryDynamoItem[] }).Items || [];
        return items.map(item => this.map(item));
    }

    /**
     * Atualiza os dados de uma subcategoria existente.
     * 
     * @param id Identificador da subcategoria.
     * @param dto Dados para atualização.
     * @returns BaseSubcategoryDto - Dados atualizados da subcategoria.
     * @throws NotFoundException se a subcategoria não for encontrada.
     */
    async update(id: string, dto: UpdateSubcategoryDto): Promise<BaseSubcategoryDto> {
        await this.findById(id);
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
            'SUBCAT#id': id,
            METADATA: 'METADATA',
        };

        const { data } = await this.dynamo.update({
            TableName: this.tableName,
            Key: key,
            UpdateExpression: 'SET ' + updates.join(', '),
            ExpressionAttributeNames: exprNames,
            ExpressionAttributeValues: exprValues,
            ReturnValues: 'ALL_NEW',
        });

        return this.map((data as { Attributes: SubcategoryDynamoItem }).Attributes);
    }

    /**
     * Remove uma subcategoria da tabela.
     * 
     * @param id Identificador da subcategoria.
     */
    async delete(id: string): Promise<void> {
        const key = {
            'SUBCAT#id': id,
            METADATA: 'METADATA',
        };
        await this.dynamo.delete({ TableName: this.tableName, Key: key });
    }
}