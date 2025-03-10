/**
 * DTO base para propriedades comuns de um post.
 */
import {
    IsString,
    IsOptional,
    IsNumber,
    IsArray,
    IsUrl,
    IsISO8601,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PostBaseDto {
    /**
     * Título do post.
     * @example 'Guia Definitivo: Construindo APIs Escaláveis com NestJS'
     */
    @ApiPropertyOptional({ description: 'Título do post', example: 'Guia Definitivo: Construindo APIs Escaláveis com NestJS' })
    @IsString()
    @IsOptional()
    title?: string;

    /**
     * Slug do post para URL.
     * @example 'guia-definitivo-apis-nestjs'
     */
    @ApiPropertyOptional({ description: 'Slug do post para URL', example: 'guia-definitivo-apis-nestjs' })
    @IsString()
    @IsOptional()
    slug?: string;

    /**
     * Conteúdo HTML do post.
     */
    @ApiPropertyOptional({ description: 'Conteúdo HTML do post' })
    @IsString()
    @IsOptional()
    contentHTML?: string;

    /**
     * Descrição breve do post.
     */
    @ApiPropertyOptional({ description: 'Descrição breve do post' })
    @IsString()
    @IsOptional()
    description?: string;

    /**
     * URL canônica do post.
     * @example 'https://meusite.com/blog/guia-definitivo-apis-nestjs'
     */
    @ApiPropertyOptional({ description: 'URL canônica do post', example: 'https://meusite.com/blog/guia-definitivo-apis-nestjs' })
    @IsUrl()
    @IsOptional()
    canonical?: string;

    /**
     * URL da imagem destacada do post.
     * @example 'url-imagem-destaque-nestjs.jpg'
     */
    @ApiPropertyOptional({ description: 'URL da imagem destacada', example: 'url-imagem-destaque-nestjs.jpg' })
    @IsUrl()
    @IsOptional()
    featuredImageURL?: string;

    /**
     * Palavras-chave para SEO.
     * @example ['API escalável', 'Backend seguro', 'NestJS', 'TypeScript']
     */
    @ApiPropertyOptional({ description: 'Palavras-chave para SEO', example: ['API escalável', 'Backend seguro', 'NestJS', 'TypeScript'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    keywords?: string[];

    /**
     * Tempo estimado de leitura em minutos.
     * @example 8
     */
    @ApiPropertyOptional({ description: 'Tempo estimado de leitura em minutos', example: 8 })
    @IsNumber()
    @IsOptional()
    readingTime?: number;

    /**
     * Status do post.
     * @example 'published'
     */
    @ApiPropertyOptional({ description: 'Status do post', example: 'published' })
    @IsString()
    @IsOptional()
    status?: string;

    /**
     * Tags associadas ao post.
     * @example ['APIs', 'Backend', 'NestJS', 'TypeScript']
     */
    @ApiPropertyOptional({ description: 'Tags associadas ao post', example: ['APIs', 'Backend', 'NestJS', 'TypeScript'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];
}
