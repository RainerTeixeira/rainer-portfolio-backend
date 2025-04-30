import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager'; // Import corrigido
import { Cache } from 'cache-manager';
import { CategoryRepository } from './category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryEntity } from './category.entity';

/**
 * Serviço responsável por gerenciar as operações relacionadas às categorias do blog.
 * Utiliza repositório para persistência e cache para otimização de consultas.
 */
@Injectable()
export class CategoryService {
    /**
     * Injeta o repositório de categorias e o gerenciador de cache.
     * @param categoryRepository Repositório para operações de banco de dados de categorias.
     * @param cacheManager Gerenciador de cache para otimizar buscas.
     */
    constructor(
        private readonly categoryRepository: CategoryRepository,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) { }

    /**
     * Cria uma nova categoria.
     * Após a criação, remove o cache relacionado à categoria criada (caso exista).
     * @param createDto Dados para criação da categoria.
     * @returns A entidade da categoria criada.
     */
    async create(createDto: CreateCategoryDto): Promise<CategoryEntity> {
        const category = await this.categoryRepository.create(createDto);
        await this.cacheManager.del(`category_${category.id}`);
        return category;
    }

    /**
     * Busca uma categoria pelo seu ID.
     * Utiliza cache para otimizar a consulta. Caso não encontre no cache, busca no banco e armazena no cache.
     * @param id Identificador da categoria.
     * @returns A entidade da categoria encontrada.
     */
    async findById(id: string): Promise<CategoryEntity> {
        const cacheKey = `category_${id}`;
        let category: CategoryEntity | null = await this.cacheManager.get(cacheKey); // Tipo ajustado
        if (!category) {
            category = await this.categoryRepository.findById(id);
            await this.cacheManager.set(cacheKey, category);
        }
        return category; // TypeScript entende que agora não é null
    }

    /**
     * Atualiza uma categoria existente.
     * Após a atualização, atualiza o cache correspondente.
     * @param id Identificador da categoria.
     * @param updateDto Dados para atualização da categoria.
     * @returns A entidade da categoria atualizada.
     */
    async update(id: string, updateDto: UpdateCategoryDto): Promise<CategoryEntity> {
        const category = await this.categoryRepository.update(id, updateDto);
        await this.cacheManager.set(`category_${id}`, category);
        return category;
    }

    /**
     * Remove uma categoria pelo seu ID.
     * Após a remoção, exclui o cache correspondente.
     * @param id Identificador da categoria.
     */
    async delete(id: string): Promise<void> {
        await this.categoryRepository.delete(id);
        await this.cacheManager.del(`category_${id}`);
    }

    /**
     * Busca uma categoria pelo seu slug.
     * @param slug Slug da categoria.
     * @returns A entidade da categoria encontrada.
     */
    async findBySlug(slug: string): Promise<CategoryEntity> {
        return await this.categoryRepository.findBySlug(slug);
    }

    /**
     * Retorna uma lista das categorias mais populares.
     * @returns Lista de entidades de categorias populares.
     */
    async findPopularCategories(): Promise<CategoryEntity[]> {
        return await this.categoryRepository.findPopularCategories();
    }
}