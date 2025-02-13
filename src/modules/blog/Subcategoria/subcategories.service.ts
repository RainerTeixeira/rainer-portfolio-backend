import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { SubcategoryDto } from './dto/subcategory.dto';
import { DynamoDbService } from '../../../services/dynamoDb.service'; // Importe seu DynamoDbService

@Injectable()
export class SubcategoriesService {
    constructor(
        @Inject(DynamoDbService) private dynamoDbService: DynamoDbService, // Injete seu DynamoDbService
    ) { }

    private subcategoriesTable = 'Subcategoria'; // Nome da sua tabela Subcategoria no DynamoDB

    async create(createSubcategoryDto: CreateSubcategoryDto): Promise<SubcategoryDto> {
        const subcategoryId = Date.now(); // Gera um ID simples (pode usar UUID ou outra estratégia)
        const params = {
            TableName: this.subcategoriesTable,
            Item: {
                subcategoryId: { N: String(subcategoryId) }, // DynamoDB espera Number como String
                categoryId: { N: String(createSubcategoryDto.categoryId) },
                name: { S: createSubcategoryDto.name },
                slug: { S: createSubcategoryDto.slug },
                relatedTools: createSubcategoryDto.relatedTools ? { L: createSubcategoryDto.relatedTools.map(tool => ({ S: tool })) } : undefined, // Lista opcional
            },
        };
        await this.dynamoDbService.put(params).catch(err => {
            console.error('DynamoDB Put Error:', err);
            throw err;
        });

        return this.findOne(subcategoryId); // Busca a subcategoria recém-criada para retornar
    }

    async findAll(): Promise<SubcategoryDto[]> {
        const params = {
            TableName: this.subcategoriesTable,
        };
        const result = await this.dynamoDbService.scan(params).catch(err => {
            console.error('DynamoDB Scan Error:', err);
            throw err;
        });
        return result.Items.map(item => this.parseSubcategoryFromDynamoDB(item)) as SubcategoryDto[];
    }

    async findOne(id: number): Promise<SubcategoryDto> {
        const params = {
            TableName: this.subcategoriesTable,
            Key: {
                subcategoryId: { N: String(id) }, // Busca pela chave primária: subcategoryId
            },
        };
        const result = await this.dynamoDbService.get(params).catch(err => {
            console.error('DynamoDB Get Error:', err);
            throw err;
        });

        if (!result.Item) {
            throw new NotFoundException(`Subcategory with ID ${id} not found`);
        }
        return this.parseSubcategoryFromDynamoDB(result.Item) as SubcategoryDto;
    }

    async update(id: number, updateSubcategoryDto: UpdateSubcategoryDto): Promise<SubcategoryDto> {
        const updateParams: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
            TableName: this.subcategoriesTable,
            Key: { subcategoryId: { N: String(id) } },
            UpdateExpression: 'SET categoryId = :categoryId, #name = :name, slug = :slug, relatedTools = :relatedTools', // 'name' é palavra reservada
            ExpressionAttributeNames: {
                '#name': 'name',
            },
            ExpressionAttributeValues: {
                ':categoryId': updateSubcategoryDto.categoryId,
                ':name': updateSubcategoryDto.name,
                ':slug': updateSubcategoryDto.slug,
                ':relatedTools': updateSubcategoryDto.relatedTools ? { L: updateSubcategoryDto.relatedTools.map(tool => ({ S: tool })) } : { L: [] }, // Lista opcional
            },
            ReturnValues: 'ALL_NEW',
        };

        const result = await this.dynamoDbService.update(updateParams).catch(err => {
            console.error('DynamoDB Update Error:', err);
            throw err;
        });

        return this.parseSubcategoryFromDynamoDB(result.Attributes) as SubcategoryDto;
    }

    async remove(id: number): Promise<void> {
        const params = {
            TableName: this.subcategoriesTable,
            Key: {
                subcategoryId: { N: String(id) },
            },
        };
        await this.dynamoDbService.delete(params).catch(err => {
            console.error('DynamoDB Delete Error:', err);
            throw err;
        });
    }

    private parseSubcategoryFromDynamoDB(item: AWS.DynamoDB.DocumentClient.AttributeMap): SubcategoryDto {
        return {
            subcategoryId: Number(item.subcategoryId.N),
            categoryId: Number(item.categoryId.N),
            name: item.name.S,
            slug: item.slug.S,
            relatedTools: item.relatedTools?.L?.map(tool => tool.S), // Lista opcional
        };
    }
}