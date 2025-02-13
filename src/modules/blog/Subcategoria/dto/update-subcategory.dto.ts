import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

export class UpdateSubcategoryDto {
    @IsOptional()
    @IsNumber()
    categoryId?: number;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    relatedTools?: string[];
}