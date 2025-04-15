import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CategoryRepository } from '../repositories/category.repository';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryEntity } from '../entities/category.entity';

@Injectable()
export class CategoriesService {
    private readonly cacheTtl = 300; // 5 minutos

    constructor(
        private readonly repository: CategoryRepository,
        @Inject(CACHE_MANAGER) private cache: Cache
    ) { }

    async create(dto: CreateCategoryDto): Promise<CategoryEntity> {
        const category = new CategoryEntity(dto);
        await this.invalidateListCache();
        return this.repository.create(category);
    }

    async findBySlug(slug: string): Promise<CategoryEntity> {
        const cacheKey = `category:slug:${slug}`;
        const cached = await this.cache.get<CategoryEntity>(cacheKey);
        if (cached) return cached;

        const category = await this.repository.findBySlug(slug);
        if (!category) throw new NotFoundException('Categoria não encontrada');

        await this.cache.set(cacheKey, category, this.cacheTtl);
        return category;
    }

    async findPopular(): Promise<CategoryEntity[]> {
        const cacheKey = 'categories:popular';
        const cached = await this.cache.get<CategoryEntity[]>(cacheKey);
        if (cached) return cached;

        const categories = await this.repository.findPopular();
        await this.cache.set(cacheKey, categories, this.cacheTtl);
        return categories;
    }

    private async invalidateListCache(): Promise<void> {
        await this.cache.del('categories:all');
        await this.cache.del('categories:popular');
    }
}