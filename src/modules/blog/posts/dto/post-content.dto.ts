import {
    IsString,
    IsOptional,
    IsNumber,
    IsArray,
    IsUrl,
    IsISO8601,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PostContentDto {
    @ApiProperty({ description: 'Título do post' })
    @IsString()
    title: string;

    @ApiProperty({ description: 'Slug do post' })
    @IsString()
    slug: string;

    @ApiProperty({ description: 'Conteúdo HTML do post' })
    @IsString()
    contentHTML: string;

    @ApiProperty({ description: 'URL da imagem de destaque' })
    @IsUrl()
    featuredImageURL: string;

    @ApiProperty({ description: 'Palavras-chave para SEO', type: [String] })
    @IsArray()
    @IsString({ each: true })
    keywords: string[];

    @ApiProperty({ description: 'Data de publicação do post', example: '2025-03-10T00:00:00Z' })
    @IsISO8601()
    publishDate: string;

    @ApiPropertyOptional({ description: 'Data de modificação do post', example: '2025-03-15T00:00:00Z' })
    @IsOptional()
    @IsISO8601()
    modifiedDate?: string;

    @ApiProperty({ description: 'Tempo de leitura estimado (em minutos)' })
    @IsNumber()
    readingTime: number;

    @ApiProperty({ description: 'Tags associadas ao post', type: [String] })
    @IsArray()
    @IsString({ each: true })
    tags: string[];

    @ApiProperty({ description: 'Número de visualizações do post' })
    @IsNumber()
    views: number;

    // Campos adicionais para SEO
    @ApiPropertyOptional({ description: 'Meta título para SEO' })
    @IsOptional()
    @IsString()
    seoTitle?: string;

    @ApiPropertyOptional({ description: 'Meta descrição para SEO' })
    @IsOptional()
    @IsString()
    seoDescription?: string;

    @ApiPropertyOptional({ description: 'Meta keywords para SEO', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    seoKeywords?: string[];
}
