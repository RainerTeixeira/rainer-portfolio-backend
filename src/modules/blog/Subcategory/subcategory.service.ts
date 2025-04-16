import { Injectable, Inject, CACHE_MANAGER } from '@nestjs/common';
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

    async create(createDto: CreateSubcategoryDto): Promise<SubcategoryEntity> {
        const subcategory = await this.subcategoryRepository.create(createDto);
        await this.cacheManager.del(`subcategory_${subcategory.parentId}`);
        return subcategory;
    }

    async findById(id: string): Promise<SubcategoryEntity> {
        const cacheKey = `subcategory_${id}`;
        let subcategory: SubcategoryEntity = await this.cacheManager.get(cacheKey);
        if (!subcategory) {
            subcategory = await this.subcategoryRepository.findById(id);
            await this.cacheManager.set(cacheKey, subcategory);
        }
        return subcategory;
    }

    async update(id: string, updateDto: UpdateSubcategoryDto): Promise<SubcategoryEntity> {
        const subcategory = await this.subcategoryRepository.update(id, updateDto);
        await this.cacheManager.set(`subcategory_${id}`, subcategory);
        return subcategory;
    }

    async delete(id: string): Promise<void> {
        await this.subcategoryRepository.delete(id);
        await this.cacheManager.del(`subcategory_${id}`);
    }

    async findByParentCategory(parentCategoryId: string): Promise<SubcategoryEntity[]> {
        return await this.subcategoryRepository.findByParentCategory(parentCategoryId);
    }

    async findBySlug(slug: string): Promise<SubcategoryEntity> {
        return await this.subcategoryRepository.findBySlug(slug);
    }
}
