/**
 * @file subcategory.service.ts
 * @description
 * Serviço responsável por centralizar e orquestrar a lógica de negócios relacionada à entidade Subcategory.
 * Atua como intermediário entre o controller, o repositório e o sistema de cache.
 * 
 * Principais responsabilidades:
 * - Criar, atualizar, remover e buscar subcategorias.
 * - Gerenciar o cache para otimizar buscas frequentes (por ID e por categoria pai).
 * - Garantir a consistência dos dados ao invalidar o cache após operações de escrita.
 * 
 * Observações:
 * - Utiliza o SubcategoryRepository para persistência e recuperação dos dados no DynamoDB.
 * - Utiliza o CacheManager do NestJS para armazenamento temporário dos resultados mais acessados.
 */

// src/modules/blog/subcategory/subcategory.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { SubcategoryRepository } from './subcategory.repository';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { SubcategoryEntity } from './subcategory.entity';

/**
 * Serviço responsável por gerenciar as operações relacionadas às subcategorias do blog.
 * Utiliza repositório para persistência e cache para otimização de consultas.
 */
@Injectable()
export class SubcategoryService {
    /**
     * Injeta o repositório de subcategorias e o gerenciador de cache.
     * @param subcategoryRepository Repositório para operações de banco de dados de subcategorias.
     * @param cacheManager Gerenciador de cache para otimizar buscas.
     */
    constructor(
        private readonly subcategoryRepository: SubcategoryRepository,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) { }

    /**
     * Cria uma nova subcategoria.
     * Após a criação, remove o cache relacionado à subcategoria criada (caso exista).
     * @param dto Dados para criação da subcategoria.
     * @returns A entidade da subcategoria criada.
     */
    async create(dto: CreateSubcategoryDto): Promise<SubcategoryEntity> {
        const entity = await this.subcategoryRepository.create(dto);
        await this.cacheManager.del(`subcategory_${entity.id}`);
        return entity;
    }

    /**
     * Busca uma subcategoria pelo seu ID.
     * Utiliza cache para otimizar a consulta. Caso não encontre no cache, busca no banco e armazena no cache.
     * @param id Identificador da subcategoria.
     * @returns A entidade da subcategoria encontrada.
     */
    async findById(id: string): Promise<SubcategoryEntity> {
        const cacheKey = `subcategory_${id}`;
        const cached = await this.cacheManager.get<SubcategoryEntity>(cacheKey);
        if (cached) {
            return cached;
        }
        const entity = await this.subcategoryRepository.findById(id);
        await this.cacheManager.set(cacheKey, entity);
        return entity;
    }

    /**
     * Atualiza uma subcategoria existente.
     * Após a atualização, atualiza o cache correspondente.
     * @param id Identificador da subcategoria.
     * @param dto Dados para atualização da subcategoria.
     * @returns A entidade da subcategoria atualizada.
     */
    async update(id: string, dto: UpdateSubcategoryDto): Promise<SubcategoryEntity> {
        const entity = await this.subcategoryRepository.update(id, dto);
        await this.cacheManager.set(`subcategory_${id}`, entity);
        return entity;
    }

    /**
     * Remove uma subcategoria pelo seu ID.
     * Após a remoção, exclui o cache correspondente.
     * @param id Identificador da subcategoria.
     */
    async delete(id: string): Promise<void> {
        await this.subcategoryRepository.delete(id);
        await this.cacheManager.del(`subcategory_${id}`);
    }

    /**
     * Lista subcategorias por categoria pai.
     * @param parentCategoryId ID da categoria pai.
     * @returns Lista de subcategorias.
     */
    async findByParentCategory(parentCategoryId: string): Promise<SubcategoryEntity[]> {
        return this.subcategoryRepository.findByParentCategory(parentCategoryId);
    }

    /**
     * Busca subcategoria pelo slug.
     * @param slug Slug da subcategoria.
     * @returns A entidade da subcategoria encontrada.
     */
    async findBySlug(slug: string): Promise<SubcategoryEntity> {
        return this.subcategoryRepository.findBySlug(slug);
    }
}
