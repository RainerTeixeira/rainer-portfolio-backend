// src/modules/blog/subcategory/subcategory.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { SubcategoryRepository } from './subcategory.repository';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { SubcategoryEntity } from './subcategory.entity';

@Injectable()
export class SubcategoryService {
    constructor(
        private readonly subcategoryRepository: SubcategoryRepository,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) { }

    async create(dto: CreateSubcategoryDto): Promise<SubcategoryEntity> {
        const entity = await this.subcategoryRepository.create(dto);
        await this.cacheManager.del(`subcategory_${entity.id}`);
        return entity;
    }

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

    async update(id: string, dto: UpdateSubcategoryDto): Promise<SubcategoryEntity> {
        const entity = await this.subcategoryRepository.update(id, dto);
        await this.cacheManager.set(`subcategory_${id}`, entity);
        return entity;
    }

    async delete(id: string): Promise<void> {
        await this.subcategoryRepository.delete(id);
        await this.cacheManager.del(`subcategory_${id}`);
    }

    async findByParentCategory(parentCategoryId: string): Promise<SubcategoryEntity[]> {
        return this.subcategoryRepository.findByParentCategory(parentCategoryId);
    }

    async findBySlug(slug: string): Promise<SubcategoryEntity> {
        return this.subcategoryRepository.findBySlug(slug);
    }
}
