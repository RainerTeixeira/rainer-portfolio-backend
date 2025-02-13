import { IsString, IsNumber, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateSubcategoryDto {
    @IsNumber()
    @IsNotEmpty()
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