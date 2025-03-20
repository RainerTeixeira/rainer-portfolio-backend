import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { CreateSubcategoryDto } from '../dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from '../dto/update-subcategory.dto';
import { SubcategoryDto } from '../dto/subcategory.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

interface DynamoDBSubcategoryItem {
    'categoryId#subcategoryId'?: { S?: string };
    subcategoryId?: { S?: string };
    name?: { S?: string };
    slug?: { S?: string };
    description?: { S?: string };
    keywords?: { S?: string };
    title?: { S?: string };
}

@ApiTags('Subcategories')
@Injectable()
export class SubcategoryService {
    private readonly tableName = process.env.DYNAMO_TABLE_NAME_SUBCATEGORIES_POSTS;

    constructor(private readonly dynamoDbService: DynamoDbService) { }

    @ApiOperation({ summary: 'Criar uma nova subcategoria' })
    @ApiResponse({ status: 201, description: 'Subcategoria criada com sucesso.', type: SubcategoryDto })
    @ApiResponse({ status: 400, description: 'Dados inválidos.' })
    async createSubcategory(createSubcategoryDto: CreateSubcategoryDto): Promise<SubcategoryDto> {
        if (!createSubcategoryDto.categoryId || !createSubcategoryDto.subcategoryId) {
            throw new BadRequestException('categoryId e subcategoryId são obrigatórios.');
        }

        const compositeKey = `${createSubcategoryDto.categoryId}#${createSubcategoryDto.subcategoryId}`;

        const params = {
            TableName: this.tableName,
            Item: {
                'categoryId#subcategoryId': { S: compositeKey },
                subcategoryId: { S: createSubcategoryDto.subcategoryId },
                name: { S: createSubcategoryDto.name },
                slug: { S: createSubcategoryDto.slug },
                description: { S: createSubcategoryDto.description },
                keywords: { S: createSubcategoryDto.keywords },
                title: { S: createSubcategoryDto.title },
            },
        };

        await this.dynamoDbService.putItem(params);
        return this.getSubcategoryById(createSubcategoryDto.categoryId, createSubcategoryDto.subcategoryId);
    }

    @ApiOperation({ summary: 'Buscar todas as subcategorias de uma categoria' })
    @ApiResponse({ status: 200, description: 'Lista de subcategorias retornada com sucesso.', type: [SubcategoryDto] })
    async getAllSubcategories(categoryId: string): Promise<SubcategoryDto> {
        const params = {
            TableName: this.tableName,
            FilterExpression: 'begins_with(#pk, :pk_prefix)',
            ExpressionAttributeNames: {
                '#pk': 'categoryId#subcategoryId',
            },
            ExpressionAttributeValues: {
                ':pk_prefix': { S: `${categoryId}#` },
            },
        };

        const result = await this.dynamoDbService.scan(params);
        if (!result.Items) {
            return;
        }

        return result.Items.map((item: DynamoDBSubcategoryItem) => this.mapToDto(item));
    }

    @ApiOperation({ summary: 'Buscar uma subcategoria por ID' })
    @ApiResponse({ status: 200, description: 'Subcategoria retornada com sucesso.', type: SubcategoryDto })
    @ApiResponse({ status: 404, description: 'Subcategoria não encontrada.' })
    async getSubcategoryById(categoryId: string, subcategoryId: string): Promise<SubcategoryDto> {
        const categoryIdSubcategoryId = `${categoryId}#${subcategoryId}`;
        return this.findOne(categoryIdSubcategoryId, subcategoryId);
    }

    @ApiOperation({ summary: 'Atualizar uma subcategoria existente' })
    @ApiResponse({ status: 200, description: 'Subcategoria atualizada com sucesso.', type: SubcategoryDto })
    @ApiResponse({ status: 404, description: 'Subcategoria não encontrada.' })
    async updateSubcategory(
        categoryId: string,
        subcategoryId: string,
        updateSubcategoryDto: UpdateSubcategoryDto
    ): Promise<SubcategoryDto> {
        const categoryIdSubcategoryId = `${categoryId}#${subcategoryId}`;
        await this.findOne(categoryIdSubcategoryId, subcategoryId);

        const updateExpression = this.dynamoDbService.buildUpdateExpression(updateSubcategoryDto);
        if (!updateExpression) {
            return this.findOne(categoryIdSubcategoryId, subcategoryId);
        }

        const params = {
            TableName: this.tableName,
            Key: {
                'categoryId#subcategoryId': { S: categoryIdSubcategoryId },
                subcategoryId: { S: subcategoryId },
            },
            ...updateExpression,
        };

        const result = await this.dynamoDbService.updateItem(params);
        if (!result.Attributes) {
            throw new NotFoundException(`Subcategoria '${subcategoryId}' na categoria '${categoryId}' não encontrada após atualização.`);
        }
        return this.mapToDto(result.Attributes as DynamoDBSubcategoryItem);
    }

    @ApiOperation({ summary: 'Deletar uma subcategoria' })
    @ApiResponse({ status: 200, description: 'Subcategoria deletada com sucesso.' })
    @ApiResponse({ status: 404, description: 'Subcategoria não encontrada.' })
    async deleteSubcategory(categoryId: string, subcategoryId: string): Promise<void> {
        const categoryIdSubcategoryId = `${categoryId}#${subcategoryId}`;
        await this.findOne(categoryIdSubcategoryId, subcategoryId);

        const params = {
            TableName: this.tableName,
            Key: {
                'categoryId#subcategoryId': { S: categoryIdSubcategoryId },
                subcategoryId: { S: subcategoryId },
            },
        };

        await this.dynamoDbService.deleteItem(params);
    }

    private async findOne(categoryIdSubcategoryId: string, subcategoryId: string): Promise<SubcategoryDto> {
        const params = {
            TableName: this.tableName,
            Key: {
                'categoryId#subcategoryId': { S: categoryIdSubcategoryId },
                subcategoryId: { S: subcategoryId },
            },
        };

        const result = await this.dynamoDbService.getItem(params);
        if (!result.Item) {
            throw new NotFoundException(`Subcategoria '${subcategoryId}' na categoria '${categoryIdSubcategoryId.split('#')[0]}' não encontrada.`);
        }
        return this.mapToDto(result.Item as DynamoDBSubcategoryItem);
    }

    private mapToDto(item: DynamoDBSubcategoryItem): SubcategoryDto {
        return {
            categoryIdSubcategoryId: item['categoryId#subcategoryId']?.S,
            subcategoryId: item.subcategoryId?.S,
            name: item.name?.S,
            slug: item.slug?.S,
            description: item.description?.S,
            keywords: item.keywords?.S,
            title: item.title?.S,
        };
    }
}