import { IsString, IsOptional, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class UpdateSeoDto {
    @IsOptional()
    @IsString()
    metaTitle?: string;

    @IsOptional()
    @IsNumber()
    priority?: number;
}

export class UpdateCategoryDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateSeoDto)
    seo?: UpdateSeoDto;
}