// src/modules/blog/posts/dto/post-base.dto.ts
import {
    IsString, IsOptional, IsNumber, IsArray, IsUrl, IsISO8601
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PostBaseDto {
    @ApiPropertyOptional({ description: 'Título do post', example: 'Guia Definitivo: Construindo APIs Escaláveis com NestJS' })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional({ description: 'Slug do post para URL', example: 'guia-definitivo-apis-nestjs' })
    @IsString()
    @IsOptional()
    slug?: string;

    @ApiPropertyOptional({ description: 'Conteúdo HTML do post' })
    @IsString()
    @IsOptional()
    contentHTML?: string;

    @ApiPropertyOptional({ description: 'Descrição breve do post' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'URL canônica do post', example: 'https://meusite.com/blog/guia-definitivo-apis-nestjs' })
    @IsUrl()
    @IsOptional()
    canonical?: string;

    @ApiPropertyOptional({ description: 'URL da imagem destacada', example: 'url-imagem-destaque-nestjs.jpg' })
    @IsUrl() // Ou IsString se não for sempre uma URL completa
    @IsOptional()
    featuredImageURL?: string;

    @ApiPropertyOptional({ description: 'Palavras-chave para SEO', example: ['API escalável', 'Backend seguro', 'NestJS', 'TypeScript'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    keywords?: string[];

    @ApiPropertyOptional({ description: 'Tempo estimado de leitura em minutos', example: 8 })
    @IsNumber()
    @IsOptional()
    readingTime?: number;

    @ApiPropertyOptional({ description: 'Status do post', example: 'published' })
    @IsString()
    @IsOptional()
    status?: string;

    @ApiPropertyOptional({ description: 'Tags associadas ao post', example: ['APIs', 'Backend', 'NestJS', 'TypeScript'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];

    @ApiPropertyOptional({ description: 'Data de publicação do post (ISO 8601)' })
    @IsISO8601()
    @IsOptional()
    publishDate?: string;
}