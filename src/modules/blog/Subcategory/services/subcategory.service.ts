// src/modules/blog/Subcategory/services/subcaSubcategorytegoria.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service'; // Importa DynamoDbService com 'Db' correto
import { CreateSubcategoryDto } from '../dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from '../dto/update-subcategory.dto';
import { SubcategoryDto } from '../dto/subcategory.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Subcategories')
@Injectable()
export class SubcategoryService {
    private readonly tableName = 'Subcategory'; // Nome da tabela no DynamoDB

    constructor(private readonly dynamoDbService: DynamoDbService) { }

    @ApiOperation({ summary: 'Criar uma nova subcategoria' })
    @ApiResponse({ status: 201, description: 'Subcategoria criada com sucesso.', type: SubcategoryDto })
    @ApiResponse({ status: 400, description: 'Dados inválidos.' })
    async createSubcategory(categoryIdSubcategoryId: string, createSubcategoryDto: CreateSubcategoryDto): Promise<SubcategoryDto> { // Método para criar uma nova subcategoria
        const compositeKey = `${createSubcategoryDto.categoryId}#${createSubcategoryDto.subcategoryId}`; // Cria chave composta (categoryId#subcategoryId)

        const params = {
            TableName: this.tableName,
            Item: {
                ...createSubcategoryDto, // Espalha as propriedades do DTO (name, slug, categoryId, subcategoryId)
                'categoryId#subcategoryId': compositeKey, // Usa a chave composta como chave de partição (PK)
                subcategoryId: createSubcategoryDto.subcategoryId, // Mantém subcategoryId como atributo separado (para chave de ordenação - SK)
            },
        };
        await this.dynamoDbService.putItem(params); // Salva o novo item no DynamoDB
        return this.getSubcategoryById(categoryIdSubcategoryId, createSubcategoryDto.subcategoryId); // Retorna a subcategoria recém-criada buscando-a pelo ID
    }

    @ApiOperation({ summary: 'Buscar todas as subcategorias de uma categoria' })
    @ApiResponse({ status: 200, description: 'Lista de subcategorias retornada com sucesso.', type: [SubcategoryDto] })
    @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
    async getAllSubcategories(categoryIdSubcategoryId: string): Promise<SubcategoryDto[]> { // Método para buscar todas as subcategorias de uma categoria específica
        const params = {
            TableName: this.tableName,
            FilterExpression: 'begins_with(#pk, :pk_prefix)', // FilterExpression para buscar por prefixo da chave de partição (PK)
            ExpressionAttributeNames: {
                '#pk': 'categoryId#subcategoryId', // Placeholder para o nome do atributo da chave de partição
            },
            ExpressionAttributeValues: {
                ':pk_prefix': { S: categoryIdSubcategoryId }, // Placeholder para o valor do prefixo da chave de partição
            },
        };
        const result = await this.dynamoDbService.scan(params); // Escaneia a tabela (busca eficiente para este caso)
        if (!result.Items) {
            return []; // Retorna array vazio se não encontrar itens
        }
        return result.Items.map((item: any) => ({ // Mapeia cada item retornado para um SubcategoryDto
            categoryIdSubcategoryId: categoryIdSubcategoryId as string, // **Correção Crucial: Nome da propriedade corrigido para categoryIdSubcategoryId**
            subcategoryId: item.subcategoryId?.S,
            name: item.name?.S,
            slug: item.slug?.S,
        } as SubcategoryDto)) || []; // Converte o objeto literal para SubcategoryDto
    }

    @ApiOperation({ summary: 'Buscar uma subcategoria por ID' })
    @ApiResponse({ status: 200, description: 'Subcategoria retornada com sucesso.', type: SubcategoryDto })
    @ApiResponse({ status: 404, description: 'Subcategoria não encontrada.' })
    async getSubcategoryById(categoryIdSubcategoryId: string, subcategoryId: string): Promise<SubcategoryDto> { // Método para buscar uma subcategoria por ID
        const params = {
            TableName: this.tableName,
            Key: {
                'categoryId#subcategoryId': categoryIdSubcategoryId, // Corrigir o formato do valor
                subcategoryId: subcategoryId, // Corrigir o formato do valor
            },
        };
        const result = await this.dynamoDbService.getItem(params); // Busca o item no DynamoDB usando a chave
        if (!result.Item) {
            throw new NotFoundException(`Subcategoria com ID '${subcategoryId}' na categoria '${categoryIdSubcategoryId}' não encontrada`); // Lança exceção se não encontrar
        }
        return { // Mapeamento do item do DynamoDB para SubcategoryDto
            categoryIdSubcategoryId: categoryIdSubcategoryId as string, // **Correção Crucial: Nome da propriedade corrigido para categoryIdSubcategoryId**
            subcategoryId: result.Item.subcategoryId?.S,
            name: result.Item.name?.S,
            slug: result.Item.slug?.S,
        } as SubcategoryDto; // Converte o objeto literal para SubcategoryDto
    }

    @ApiOperation({ summary: 'Atualizar uma subcategoria existente' })
    @ApiResponse({ status: 200, description: 'Subcategoria atualizada com sucesso.', type: SubcategoryDto })
    @ApiResponse({ status: 404, description: 'Subcategoria não encontrada.' })
    async updateSubcategory(categoryIdSubcategoryId: string, subcategoryId: string, updateSubcategoryDto: UpdateSubcategoryDto): Promise<SubcategoryDto> { // Método para atualizar uma subcategoria existente
        await this.getSubcategoryById(categoryIdSubcategoryId, subcategoryId); // Garante que a subcategoria existe antes de tentar atualizar
        const updateExpression = this.dynamoDbService.buildUpdateExpression(updateSubcategoryDto); // Constrói a expressão de atualização dinamicamente
        if (!updateExpression) {
            return this.getSubcategoryById(categoryIdSubcategoryId, subcategoryId); // Se não houver campos para atualizar, retorna a subcategoria existente
        }

        const params = {
            TableName: this.tableName,
            Key: {
                'categoryId#subcategoryId': categoryIdSubcategoryId, // Chave primária de partição (PK)
                subcategoryId: subcategoryId, // Chave primária de ordenação (SK)
            },
            ...updateExpression, // Inclui a expressão de atualização e atributos
            ReturnValues: 'ALL_NEW' as any, // Correção para TS2345: Casting para 'any' - paliativo para problema de tipo
        };

        const result = await this.dynamoDbService.updateItem(params); // Atualiza o item no DynamoDB
        if (!result.Attributes) {
            throw new NotFoundException(`Subcategoria com ID '${subcategoryId}' na categoria '${categoryIdSubcategoryId}' não encontrada após atualização.`); // Lança exceção se não encontrar atributos após atualização
        }
        return {  // Mapeamento dos atributos retornados para SubcategoryDto
            categoryIdSubcategoryId: categoryIdSubcategoryId as string, // **Correção Crucial: Nome da propriedade corrigido para categoryIdSubcategoryId**
            subcategoryId: result.Attributes.subcategoryId?.S,
            name: result.Attributes.name?.S,
            slug: result.Attributes.slug?.S,
        } as SubcategoryDto; // Converte o objeto literal para SubcategoryDto
    }

    @ApiOperation({ summary: 'Deletar uma subcategoria' })
    @ApiResponse({ status: 200, description: 'Subcategoria deletada com sucesso.' })
    @ApiResponse({ status: 404, description: 'Subcategoria não encontrada.' })
    async deleteSubcategory(categoryIdSubcategoryId: string, subcategoryId: string): Promise<void> { // Método para deletar uma subcategoria
        await this.getSubcategoryById(categoryIdSubcategoryId, subcategoryId); // Garante que a subcategoria existe antes de deletar
        const params = {
            TableName: this.tableName,
            Key: {
                'categoryId#subcategoryId': categoryIdSubcategoryId, // Chave primária de partição (PK)
                subcategoryId: subcategoryId, // Chave primária de ordenação (SK)
            },
        };
        await this.dynamoDbService.deleteItem(params); // Deleta o item do DynamoDB
    }
}