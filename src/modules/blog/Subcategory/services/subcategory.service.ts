// src/modules/blog/Subcategory/services/subcaSubcategorytegoria.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service'; // Importa DynamoDbService com 'Db' correto
import { CreateSubcategoryDto } from '../dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from '../dto/update-subcategory.dto';
import { SubcategoryDto } from '../dto/subcategory.dto';

@Injectable()
export class SubcategoryService {
    private readonly tableName = 'Subcategory'; // Nome da tabela no DynamoDB

    constructor(private readonly dynamoDbService: DynamoDbService) { }

    async createSubcategory(categoryIdSubcategoryId: string, createSubcategoryDto: CreateSubcategoryDto): Promise<SubcategoryDto> { // Correção: Renomeado para createSubcategory para consistência
        const compositeKey = `${createSubcategoryDto.categoryId}#${createSubcategoryDto.subcategoryId}`; // Cria chave composta

        const params = {
            TableName: this.tableName,
            Item: {
                ...createSubcategoryDto, // Espalha as propriedades do DTO
                'categoryId#subcategoryId': compositeKey, // Usa a chave composta como chave de partição
                subcategoryId: createSubcategoryDto.subcategoryId, // Mantém subcategoryId como atributo separado
            },
        };
        await this.dynamoDbService.putItem(params); // Salva o item no DynamoDB
        return this.getSubcategoryById(categoryIdSubcategoryId, createSubcategoryDto.subcategoryId); // Retorna a subcategoria criada
    }

    async getAllSubcategories(categoryIdSubcategoryId: string): Promise<SubcategoryDto[]> { // Correção: Renomeado para getAllSubcategories e ajustada a lógica
        const params = {
            TableName: this.tableName,
            FilterExpression: 'begins_with(#pk, :pk_prefix)', // Correção: FilterExpression para buscar por prefixo da chave de partição
            ExpressionAttributeNames: {
                '#pk': 'categoryId#subcategoryId', // Define '#pk' para 'categoryId#subcategoryId'
            },
            ExpressionAttributeValues: {
                ':pk_prefix': categoryIdSubcategoryId, // Define ':pk_prefix' para o valor de categoryIdSubcategoryId
            },
        };
        const result = await this.dynamoDbService.scan(params); // Correção: Usando dynamoDbService.scan (nome correto do método)
        if (!result.Items) {
            return []; // Retorna array vazio se não encontrar itens
        }
        return result.Items.map((item: any) => ({ // Correção: Adicionado tipo 'any' para item e mapeamento explícito para SubcategoryDto
            'categoryId#subcategoryId': item['categoryId#subcategoryId']?.S, // Mantém, busca do item do DynamoDB
            subcategoryId: item.subcategoryId?.S,
            name: item.name?.S,
            slug: item.slug?.S,
        } as SubcategoryDto)) || [];
    }

    async getSubcategoryById(categoryIdSubcategoryId: string, subcategoryId: string): Promise<SubcategoryDto> { // Correção: Renomeado para getSubcategoryById
        const params = {
            TableName: this.tableName,
            Key: {
                'categoryId#subcategoryId': categoryIdSubcategoryId, // Usa a chave de partição composta
                subcategoryId: subcategoryId, // Usa subcategoryId como chave de ordenação
            },
        };
        const result = await this.dynamoDbService.getItem(params); // Busca o item por chave
        if (!result.Item) {
            throw new NotFoundException(`Subcategory com ID '${subcategoryId}' na categoria '${categoryIdSubcategoryId}' não encontrada`); // Lança exceção se não encontrar
        }
        return { // Correção: Mapeamento explícito para SubcategoryDto
            'categoryId#subcategoryId': result.Item['categoryId#subcategoryId']?.S, // Mantém, busca do item do DynamoDB
            subcategoryId: result.Item.subcategoryId?.S,
            name: result.Item.name?.S,
            slug: result.Item.slug?.S,
        } as SubcategoryDto;
    }

    async updateSubcategory(categoryIdSubcategoryId: string, subcategoryId: string, updateSubcategoryDto: UpdateSubcategoryDto): Promise<SubcategoryDto> { // Correção: Renomeado para updateSubcategory
        await this.getSubcategoryById(categoryIdSubcategoryId, subcategoryId); // Verifica se a subcategoria existe antes de atualizar
        const updateExpression = this.dynamoDbService.buildUpdateExpression(updateSubcategoryDto); // Constrói a expressão de atualização dinamicamente
        if (!updateExpression) {
            return this.getSubcategoryById(categoryIdSubcategoryId, subcategoryId); // Se não houver nada para atualizar, retorna a subcategoria existente
        }

        const params = {
            TableName: this.tableName,
            Key: {
                'categoryId#subcategoryId': categoryIdSubcategoryId, // Usa a chave de partição composta
                subcategoryId: subcategoryId, // Usa subcategoryId como chave de ordenação
            },
            ...updateExpression, // Espalha a expressão de atualização construída
            ReturnValues: 'ALL_NEW', // Retorna todos os atributos *após* a atualização
        };

        const result = await this.dynamoDbService.updateItem(params); // Atualiza o item no DynamoDB
        if (!result.Attributes) { // Verifica se `result.Attributes` existe para evitar erro de "possibly undefined"
            throw new NotFoundException(`Subcategoria com ID '${subcategoryId}' na categoria '${categoryIdSubcategoryId}' não encontrada após atualização.`); // Lança exceção se updateItem não retornar Attributes
        }
        return {  // Correção: Mapeamento explícito para SubcategoryDto
            'categoryId#subcategoryId': result.Attributes['categoryId#subcategoryId']?.S, // Mantém, busca do Attributes retornado pelo DynamoDB
            subcategoryId: result.Attributes.subcategoryId?.S,
            name: result.Attributes.name?.S,
            slug: result.Attributes.slug?.S,
        } as SubcategoryDto;
    }

    async deleteSubcategory(categoryIdSubcategoryId: string, subcategoryId: string): Promise<void> { // Correção: Renomeado para deleteSubcategory
        await this.getSubcategoryById(categoryIdSubcategoryId, subcategoryId); // Verifica se a subcategoria existe antes de deletar
        const params = {
            TableName: this.tableName,
            Key: {
                'categoryId#subcategoryId': categoryIdSubcategoryId, // Usa a chave de partição composta
                subcategoryId: subcategoryId, // Usa subcategoryId como chave de ordenação
            },
        };
        await this.dynamoDbService.deleteItem(params); // Deleta o item do DynamoDB
    }
}