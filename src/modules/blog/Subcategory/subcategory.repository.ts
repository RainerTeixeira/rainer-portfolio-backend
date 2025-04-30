/**
 * @file subcategory.repository.ts
 * @description
 * Repositório responsável por gerenciar as operações de acesso a dados da entidade Subcategory no DynamoDB.
 * Fornece métodos para criar, buscar, atualizar, remover e listar subcategorias, além de buscar por slug e listar por categoria pai.
 * Utiliza índices secundários globais (GSI) para otimizar buscas por slug e por categoria pai.
 * 
 * Observações:
 * - O mapeamento entre o formato do DynamoDB e a entidade SubcategoryEntity é realizado no próprio repositório.
 * - O repositório utiliza o serviço DynamoDbService para abstrair operações de baixo nível com o banco.
 * - Exceções são lançadas para casos de não encontrados ou falhas em operações críticas.
 */
// src/modules/blog/subcategory/subcategory.repository.ts
import { Injectable, NotFoundException } from '@nestjs/common';
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
        await this.dynamoDbService.put({ TableName: this.TABLE_NAME, Item: entity });
        return entity;
    }

    /**
     * Busca uma subcategoria pelo seu ID.
     * @param id Identificador da subcategoria.
     * @returns Entidade da subcategoria encontrada.
     * @throws NotFoundException se a subcategoria não for encontrada.
     */
    async findById(id: string): Promise<SubcategoryEntity> {
        const result = await this.dynamoDbService.get({
            TableName: this.TABLE_NAME,
            Key: { 'SUBCAT#id': id, METADATA: 'METADATA' },
        });
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
     */
    async update(id: string, dto: UpdateSubcategoryDto): Promise<SubcategoryEntity> {
        const existing = await this.findById(id);
        const updated = { ...existing, ...dto };
        await this.dynamoDbService.put({ TableName: this.TABLE_NAME, Item: updated });
        return new SubcategoryEntity(updated);
    }

    /**
     * Remove uma subcategoria do banco de dados.
     * @param id Identificador da subcategoria.
     */
    async delete(id: string): Promise<void> {
        await this.dynamoDbService.delete({
            TableName: this.TABLE_NAME,
            Key: { 'SUBCAT#id': id, METADATA: 'METADATA' },
        });
    }

    /**
     * Lista subcategorias por categoria pai utilizando índice secundário (GSI_ParentCategory).
     * @param parentCategoryId ID da categoria pai.
     * @returns Lista de subcategorias.
     */
    async findByParentCategory(parentCategoryId: string): Promise<SubcategoryEntity[]> {
        const result = await this.dynamoDbService.query({
            TableName: this.TABLE_NAME,
            IndexName: 'GSI_ParentCategory',
            KeyConditionExpression: 'parent_category_id = :pid',
            ExpressionAttributeValues: { ':pid': parentCategoryId },
            ScanIndexForward: true,
        });
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
        const result = await this.dynamoDbService.query({
            TableName: this.TABLE_NAME,
            IndexName: 'GSI_Slug',
            KeyConditionExpression: 'slug = :s and #t = :type',
            ExpressionAttributeNames: { '#t': 'type' },
            ExpressionAttributeValues: { ':s': slug, ':type': 'SUBCATEGORY' },
        });
        const items = result.data?.Items || [];
        if (!items.length) {
            throw new NotFoundException(`Subcategory with slug ${slug} not found`);
        }
        return new SubcategoryEntity(items[0]);
    }
}
