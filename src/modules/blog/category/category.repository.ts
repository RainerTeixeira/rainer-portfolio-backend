import { Injectable, NotFoundException } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { CategoryEntity } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/**
 * Repositório responsável por realizar operações de persistência e consulta de categorias no DynamoDB.
 * Implementa métodos para criar, buscar, atualizar, remover e consultar categorias por diferentes critérios.
 */
@Injectable()
export class CategoryRepository {
    private readonly TABLE_NAME = 'Category';

    constructor(private readonly dynamoDbService: DynamoDbService) { }

    /**
     * Cria uma nova categoria no banco de dados.
     * @param createDto Dados para criação da categoria.
     * @returns Entidade da categoria criada.
     */
    async create(createDto: CreateCategoryDto): Promise<CategoryEntity> {
        const category = new CategoryEntity(createDto);
        const params = {
            TableName: this.TABLE_NAME,
            Item: category,
        };
        await this.dynamoDbService.put(params);
        return category;
    }

    /**
     * Busca uma categoria pelo seu ID.
     * @param id Identificador da categoria.
     * @returns Entidade da categoria encontrada.
     * @throws NotFoundException se a categoria não for encontrada.
     */
    async findById(id: string): Promise<CategoryEntity> {
        const params = {
            TableName: this.TABLE_NAME,
            Key: { 'CATEGORY#id': id, METADATA: 'METADATA' },
        };
        const result = await this.dynamoDbService.get(params);
        if (!result?.data?.Item) {
            throw new NotFoundException(`Category with id ${id} not found`);
        }
        return new CategoryEntity(result.data.Item);
    }

    /**
     * Atualiza uma categoria existente.
     * @param id Identificador da categoria.
     * @param updateDto Dados para atualização.
     * @returns Entidade da categoria atualizada.
     */
    async update(id: string, updateDto: UpdateCategoryDto): Promise<CategoryEntity> {
        const existing = await this.findById(id);
        const updated = { ...existing, ...updateDto };
        const params = {
            TableName: this.TABLE_NAME,
            Item: updated,
        };
        await this.dynamoDbService.put(params);
        return new CategoryEntity(updated);
    }

    /**
     * Remove uma categoria do banco de dados.
     * @param id Identificador da categoria.
     */
    async delete(id: string): Promise<void> {
        const params = {
            TableName: this.TABLE_NAME,
            Key: { 'CATEGORY#id': id, METADATA: 'METADATA' },
        };
        await this.dynamoDbService.delete(params);
    }

    /**
     * Busca uma categoria pelo seu slug utilizando índice secundário (GSI_Slug).
     * @param slug Slug da categoria.
     * @returns Entidade da categoria encontrada.
     * @throws NotFoundException se a categoria não for encontrada.
     */
    async findBySlug(slug: string): Promise<CategoryEntity> {
        const params = {
            TableName: this.TABLE_NAME,
            IndexName: 'GSI_Slug',
            KeyConditionExpression: 'gsiSlug = :slug and gsiSlugType = :type',
            ExpressionAttributeValues: {
                ':slug': slug,
                ':type': 'CATEGORY',
            },
        };
        const result = await this.dynamoDbService.query(params);
        if (!result?.data?.Items || result.data.Items.length === 0) {
            throw new NotFoundException(`Category with slug ${slug} not found`);
        }
        return new CategoryEntity(result.data.Items[0]);
    }

    /**
     * Retorna uma lista das categorias mais populares utilizando índice secundário (GSI_Popular).
     * @returns Array de entidades de categorias populares.
     */
    async findPopularCategories(): Promise<CategoryEntity[]> {
        const params = {
            TableName: this.TABLE_NAME,
            IndexName: 'GSI_Popular',
            KeyConditionExpression: 'gsiPopularType = :type',
            ExpressionAttributeValues: {
                ':type': 'CATEGORY',
            },
            ScanIndexForward: false,
        };
        const result = await this.dynamoDbService.query(params);

        // Verifica se result.data.Items existe. Se não, retorna array vazio.
        const items = result?.data?.Items || [];

        return items.map((item: Record<string, unknown>) => new CategoryEntity(item));
    }
}
