import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { SubcategoryRepository } from '../repositories/subcategory.repository';
import { SubcategoryEntity } from '../entities/subcategory.entity';

@Injectable()
export class SubcategoriesService {
    private readonly cacheTtl = 300;

    constructor(
        private readonly repository: SubcategoryRepository,
        @Inject(CACHE_MANAGER) private cache: Cache
    ) { }

    async findByParent(parentId: string): Promise<SubcategoryEntity[]> {
        const cacheKey = `subcategories:parent:${parentId}`;
        const cached = await this.cache.get<SubcategoryEntity[]>(cacheKey);
        if (cached) return cached;

        const subcategories = await this.repository.findByParent(parentId);
        await this.cache.set(cacheKey, subcategories, this.cacheTtl);
        return subcategories;
    }

    async findBySlug(slug: string): Promise<SubcategoryEntity> {
        const cacheKey = `subcategory:slug:${slug}`;
        const cached = await this.cache.get<SubcategoryEntity>(cacheKey);
        if (cached) return cached;

        const subcategory = await this.repository.findBySlug(slug);
        if (!subcategory) throw new NotFoundException('Subcategoria não encontrada');

        await this.cache.set(cacheKey, subcategory, this.cacheTtl);
        return subcategory;
    }
}