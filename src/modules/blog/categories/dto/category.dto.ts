import { IsString, IsNumber, IsNotEmpty, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class SeoDto {
    @IsString()
    @IsNotEmpty()
    metaTitle: string;

    @IsNumber()
    @IsOptional()
    priority?: number;
}

export class CategoryDto {
    @IsNumber()
    categoryId: number;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    slug: string;

    @ValidateNested()
    @Type(() => SeoDto)
    seo: SeoDto;
}