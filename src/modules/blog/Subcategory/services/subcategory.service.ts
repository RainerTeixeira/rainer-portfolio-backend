// src/modules/blog/subcategories/dto/subcategory.dto.ts (Example structure)
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Define SubcategorySeoDto if it doesn't exist or import if it does
export class SubcategorySeoDto {
    @ApiPropertyOptional() @IsOptional() @IsString() canonical?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
    @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsString({ each: true }) keywords?: string[];
    @ApiPropertyOptional() @IsOptional() @IsString() metaTitle?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() priority?: string;
}

export class SubcategoryDto {
    @ApiProperty({ description: 'Chave composta: categoryId#subcategoryId', example: 'cat-123#sub-456' })
    @IsString()
    @IsNotEmpty()
    categoryIdSubcategoryId: string; // Composite key

    @ApiProperty({ description: 'ID da Categoria pai', example: 'cat-123' })
    @IsString()
    @IsNotEmpty()
    categoryId: string; // Extracted for convenience

    @ApiProperty({ description: 'ID da Subcategoria', example: 'sub-456' })
    @IsString()
    @IsNotEmpty()
    subcategoryId: string;

    @ApiProperty({ description: 'Nome da Subcategoria', example: 'Gadgets Inteligentes' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Slug da Subcategoria para URL', example: 'gadgets-inteligentes' })
    @IsString()
    @IsNotEmpty()
    slug: string;

    @ApiPropertyOptional({ description: 'Descrição opcional da Subcategoria' })
    @IsOptional()
    @IsString()
    description?: string;

    // Assuming 'title' and 'keywords' might be part of SEO now
    // @ApiPropertyOptional() @IsOptional() @IsString() keywords?: string;
    // @ApiPropertyOptional() @IsOptional() @IsString() title?: string;

    @ApiPropertyOptional({ description: 'Dados de SEO da subcategoria', type: SubcategorySeoDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => SubcategorySeoDto)
    seo?: SubcategorySeoDto;


    /**
     * Cria uma instância de SubcategoryDto a partir de um item do DynamoDB (DocumentClient).
     * @param item O item retornado pelo DynamoDBDocumentClient.
     * @returns Uma instância de SubcategoryDto ou null se o item for inválido.
     */
    static fromDynamoDbItem(item: Record<string, any>): SubcategoryDto | null {
        const compositeKey = item['categoryId#subcategoryId'];
        if (!item || typeof compositeKey !== 'string' || typeof item.subcategoryId !== 'string' || typeof item.name !== 'string' || typeof item.slug !== 'string') {
            console.error('Invalid DynamoDB item for SubcategoryDto:', item);
            return null;
        }

        const parts = compositeKey.split('#');
        if (parts.length !== 2) {
            console.error('Invalid composite key format for SubcategoryDto:', compositeKey);
            return null;
        }
        const categoryId = parts[0];


        try {
            const dto = new SubcategoryDto();
            dto.categoryIdSubcategoryId = compositeKey;
            dto.categoryId = categoryId;
            dto.subcategoryId = item.subcategoryId;
            dto.name = item.name;
            dto.slug = item.slug;
            dto.description = typeof item.description === 'string' ? item.description : undefined;

            // Map SEO object
            if (typeof item.seo === 'object' && item.seo !== null) {
                const seoDto = new SubcategorySeoDto();
                seoDto.canonical = typeof item.seo.canonical === 'string' ? item.seo.canonical : undefined;
                seoDto.description = typeof item.seo.description === 'string' ? item.seo.description : undefined;
                seoDto.keywords = Array.isArray(item.seo.keywords) ? item.seo.keywords.filter(k => typeof k === 'string') : undefined;
                seoDto.metaTitle = typeof item.seo.metaTitle === 'string' ? item.seo.metaTitle : undefined;
                seoDto.priority = typeof item.seo.priority === 'string' ? item.seo.priority : undefined;
                // Assign only if there are actual SEO properties
                if (Object.values(seoDto).some(v => v !== undefined)) {
                    dto.seo = seoDto;
                }
            }

            // Optional: Validate DTO
            // import { validateSync } from 'class-validator';
            // const errors = validateSync(dto);
            // if (errors.length > 0) { ... }

            return dto;
        } catch (error) {
            console.error('Error mapping DynamoDB item to SubcategoryDto:', error, item);
            return null;
        }
    }
}

// Ensure CreateSubcategoryDto and UpdateSubcategoryDto are defined appropriately
// Example: src/modules/blog/subcategories/dto/create-subcategory.dto.ts
import { IsString, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SubcategorySeoDto } from './subcategory.dto'; // Reuse SEO DTO

export class CreateSubcategoryDto {
    @IsString() @IsNotEmpty() categoryId: string;
    @IsString() @IsNotEmpty() subcategoryId: string; // Or generate this in service?
    @IsString() @IsNotEmpty() name: string;
    @IsString() @IsNotEmpty() slug: string;
    @IsOptional() @IsString() description?: string;
    @IsOptional() @ValidateNested() @Type(() => SubcategorySeoDto) seo?: SubcategorySeoDto;
}

// Example: src/modules/blog/subcategories/dto/update-subcategory.dto.ts
import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SubcategorySeoDto } from './subcategory.dto'; // Reuse SEO DTO

export class UpdateSubcategoryDto {
    @IsOptional() @IsString() @IsNotEmpty() name?: string;
    @IsOptional() @IsString() @IsNotEmpty() slug?: string;
    @IsOptional() @IsString() description?: string;
    @IsOptional() @ValidateNested() @Type(() => SubcategorySeoDto) seo?: SubcategorySeoDto;
    // Cannot update categoryId or subcategoryId
}