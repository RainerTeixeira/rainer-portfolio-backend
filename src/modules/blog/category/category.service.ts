import { Injectable, Inject, CACHE_MANAGER } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CategoryRepository } from './category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryEntity } from './category.entity';

@Injectable()
export class CategoryService {
    constructor(
        private readonly categoryRepository: CategoryRepository,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) { }

    async create(createDto: CreateCategoryDto): Promise<CategoryEntity> {
        const category = await this.categoryRepository.create(createDto);
        await this.cacheManager.del(`category_${category.id}`);
        return category;
    }

    async findById(id: string): Promise<CategoryEntity> {
        const cacheKey = `category_${id}`;
        let category: CategoryEntity = await this.cacheManager.get(cacheKey);
        if (!category) {
            category = await this.categoryRepository.findById(id);
            await this.cacheManager.set(cacheKey, category);
        }
        return category;
    }

    async update(id: string, updateDto: UpdateCategoryDto): Promise<CategoryEntity> {
        const category = await this.categoryRepository.update(id, updateDto);
        await this.cacheManager.set(`category_${id}`, category);
        return category;
    }

    async delete(id: string): Promise<void> {
        await this.categoryRepository.delete(id);
        await this.cacheManager.del(`category_${id}`);
    }

    async findBySlug(slug: string): Promise<CategoryEntity> {
        return await this.categoryRepository.findBySlug(slug);
    }

    async findPopularCategories(): Promise<CategoryEntity[]> {
        return await this.categoryRepository.findPopularCategories();
    }
}
