import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { SubcategoryEntity } from './subcategory.entity';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';

/**
 * Classe de repositório para Subcategory.
 * Responsável por persistir, buscar, atualizar e remover subcategorias no DynamoDB.
 * Utiliza índices secundários para buscas otimizadas por slug e categoria pai.
 */
@Injectable()
export class SubcategoryRepository {
    private readonly TABLE_NAME = 'Subcategory';

    constructor(private readonly dynamoDbService: DynamoDbService) { }

    /**
     * Cria uma nova subcategoria no banco de dados.
     * @param dto Dados para criação da subcategoria.
     * @returns Entidade da subcategoria criada.
     */
    async create(dto: CreateSubcategoryDto): Promise<SubcategoryEntity> {
        const entity = new SubcategoryEntity(dto);
        const params = {
            TableName: this.TABLE_NAME,
            Item: entity,
        };
        try {
            await this.dynamoDbService.put(params);
        } catch (error) {
            throw new InternalServerErrorException('Failed to create subcategory', error);
        }
        return entity;
    }

    /**
     * Busca uma subcategoria pelo seu ID.
     * @param id Identificador da subcategoria.
     * @returns Entidade da subcategoria encontrada.
     * @throws NotFoundException se a subcategoria não for encontrada.
     */
    async findById(id: string): Promise<SubcategoryEntity> {
        const params = {
            TableName: this.TABLE_NAME,
            Key: { 'SUBCAT#id': id, METADATA: 'METADATA' },
        };
        const result = await this.dynamoDbService.get(params);
        if (!result?.data?.Item) {
            throw new NotFoundException(`Subcategory with id ${id} not found`);
        }
        return new SubcategoryEntity(result.data.Item);
    }

    /**
     * Atualiza uma subcategoria existente.
     * @param id Identificador da subcategoria.
     * @param dto Dados para atualização.
     * @returns Entidade da subcategoria atualizada.
     * @throws NotFoundException se a subcategoria não for encontrada.
     * @throws InternalServerErrorException se ocorrer um erro durante a atualização.
     */
    async update(id: string, dto: UpdateSubcategoryDto): Promise<SubcategoryEntity> {
        const existing = await this.findById(id);
        const updated = { ...existing, ...dto };
        const params = {
            TableName: this.TABLE_NAME,
            Item: updated,
        };
        try {
            await this.dynamoDbService.put(params);
        } catch (error) {
            throw new InternalServerErrorException('Failed to update subcategory', error);
        }
        return new SubcategoryEntity(updated);
    }

    /**
     * Remove uma subcategoria do banco de dados.
     * @param id Identificador da subcategoria.
     * @throws NotFoundException se a subcategoria não for encontrada.
     * @throws InternalServerErrorException se ocorrer um erro durante a remoção.
     */
    async delete(id: string): Promise<void> {
        try {
            await this.dynamoDbService.delete({
                TableName: this.TABLE_NAME,
                Key: { 'SUBCAT#id': id, METADATA: 'METADATA' },
            });
        } catch (error) {
            throw new InternalServerErrorException('Failed to delete subcategory', error);
        }
    }

    /**
     * Lista subcategorias por categoria pai utilizando índice secundário (GSI_ParentCategory).
     * @param parentCategoryId ID da categoria pai.
     * @returns Lista de subcategorias.
     */
    async findByParentCategory(parentCategoryId: string): Promise<SubcategoryEntity[]> {
        const params = {
            TableName: this.TABLE_NAME,
            IndexName: 'GSI_ParentCategory',
            KeyConditionExpression: 'parent_category_id = :pid',
            ExpressionAttributeValues: { ':pid': parentCategoryId },
            ScanIndexForward: true,
        };
        const result = await this.dynamoDbService.query(params);
        const items = result.data?.Items || [];
        return items.map((i: any) => new SubcategoryEntity(i));
    }

    /**
     * Busca subcategoria pelo slug utilizando índice secundário (GSI_Slug).
     * @param slug Slug da subcategoria.
     * @returns Entidade da subcategoria encontrada.
     * @throws NotFoundException se a subcategoria não for encontrada.
     */
    async findBySlug(slug: string): Promise<SubcategoryEntity> {
        const params = {
            TableName: this.TABLE_NAME,
            IndexName: 'GSI_Slug',
            KeyConditionExpression: 'slug = :s and #t = :type',
            ExpressionAttributeNames: { '#t': 'type' },
            ExpressionAttributeValues: { ':s': slug, ':type': 'SUBCATEGORY' },
        };
        const result = await this.dynamoDbService.query(params);
        const items = result.data?.Items || [];
        if (!items.length) {
            throw new NotFoundException(`Subcategory with slug ${slug} not found`);
        }
        return new SubcategoryEntity(items[0]);
    }
}
