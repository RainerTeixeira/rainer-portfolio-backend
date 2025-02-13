import { IsString, IsNumber, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class SubcategoryDto {
    @IsNumber()
    subcategoryId: number;

    @IsNumber()
    categoryId: number;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    slug: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    relatedTools?: string[];
}