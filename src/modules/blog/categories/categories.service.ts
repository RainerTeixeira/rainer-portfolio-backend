import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryDto } from './dto/category.dto';
import { DynamoDbService } from '../../../services/dynamoDb.service'; // Importe seu DynamoDbService

@Injectable()
export class CategoriesService {
    constructor(
        @Inject(DynamoDbService) private dynamoDbService: DynamoDbService, // Injete seu DynamoDbService
    ) { }

    private categoriesTable = 'Categories'; // Nome da sua tabela Categories no DynamoDB

    async create(createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
        const categoryId = Date.now(); // Gera um ID simples (pode usar UUID ou outra estratégia)
        const params = {
            TableName: this.categoriesTable,
            Item: {
                categoryId: { N: String(categoryId) }, // DynamoDB espera Number como String
                name: { S: createCategoryDto.name },
                slug: { S: createCategoryDto.slug },
                seo: { M: { metaTitle: { S: createCategoryDto.seo.metaTitle }, priority: { N: String(createCategoryDto.seo.priority || 0) } } },
            },
        };
        await this.dynamoDbService.put(params).catch(err => {
            console.error('DynamoDB Put Error:', err);
            throw err;
        });

        return this.findOne(categoryId); // Busca a categoria recém-criada para retornar
    }

    async findAll(): Promise<CategoryDto[]> {
        const params = {
            TableName: this.categoriesTable,
        };
        const result = await this.dynamoDbService.scan(params).catch(err => {
            console.error('DynamoDB Scan Error:', err);
            throw err;
        });
        return result.Items.map(item => this.parseCategoryFromDynamoDB(item)) as CategoryDto[];
    }

    async findOne(id: number): Promise<CategoryDto> {
        const params = {
            TableName: this.categoriesTable,
            Key: {
                categoryId: { N: String(id) }, // Busca pela chave primária: categoryId
            },
        };
        const result = await this.dynamoDbService.get(params).catch(err => {
            console.error('DynamoDB Get Error:', err);
            throw err;
        });

        if (!result.Item) {
            throw new NotFoundException(`Category with ID ${id} not found`); // Usa NotFoundException do NestJS
        }
        return this.parseCategoryFromDynamoDB(result.Item) as CategoryDto;
    }

    async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<CategoryDto> {
        const updateParams: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
            TableName: this.categoriesTable,
            Key: { categoryId: { N: String(id) } },
            UpdateExpression: 'SET #name = :name, slug = :slug, seo.#metaTitle = :metaTitle, seo.priority = :priority', // Expressão de update
            ExpressionAttributeNames: {
                '#name': 'name', // 'name' é palavra reservada no DynamoDB, então usamos ExpressionAttributeNames
                '#metaTitle': 'metaTitle', // 'metaTitle' dentro de 'seo'
            },
            ExpressionAttributeValues: {
                ':name': updateCategoryDto.name,
                ':slug': updateCategoryDto.slug,
                ':metaTitle': updateCategoryDto.seo?.metaTitle,
                ':priority': updateCategoryDto.seo?.priority ? { N: String(updateCategoryDto.seo.priority) } : { N: '0' }, // Default priority 0 if not provided
            },
            ReturnValues: 'ALL_NEW', // Retorna o item atualizado
        };

        const result = await this.dynamoDbService.update(updateParams).catch(err => {
            console.error('DynamoDB Update Error:', err);
            throw err;
        });

        return this.parseCategoryFromDynamoDB(result.Attributes) as CategoryDto;
    }

    async remove(id: number): Promise<void> {
        const params = {
            TableName: this.categoriesTable,
            Key: {
                categoryId: { N: String(id) },
            },
        };
        await this.dynamoDbService.delete(params).catch(err => {
            console.error('DynamoDB Delete Error:', err);
            throw err;
        });
    }

    private parseCategoryFromDynamoDB(item: AWS.DynamoDB.DocumentClient.AttributeMap): CategoryDto {
        return {
            categoryId: Number(item.categoryId.N),
            name: item.name.S,
            slug: item.slug.S,
            seo: {
                metaTitle: item.seo.M.metaTitle.S,
                priority: Number(item.seo.M.priority.N) || 0, // Default 0 if priority is not present
            },
        };
    }
}