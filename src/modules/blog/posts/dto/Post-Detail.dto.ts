// src/modules/blog/posts/dto/Post-detail.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray } from 'class-validator';
import { PostSummaryDto } from './Post-summary.dto'; // Importante importar PostSummaryDto

export class PostDetailDto extends PostSummaryDto {
    @IsString()
    @IsNotEmpty()
    contentHTML: string;

    @IsString()
    @IsNotEmpty()
    authorId: string;

    @IsOptional()
    @IsString()
    canonical?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    keywords?: string[];

    @IsOptional()
    @IsNumber()
    readingTime?: number;

    @IsOptional()
    @IsNumber()
    views?: number;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    modifiedDate?: string; // Adicionando modifiedDate para Detail DTO

}