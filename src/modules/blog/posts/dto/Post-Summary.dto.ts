// src/modules/blog/posts/dto/post-summary.dto.ts

import { IsString, IsUrl, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * @dto PostSummaryDto
 * @description Data Transfer Object para representar um resumo de um post,
 * frequentemente usado em listagens. Contém apenas os campos essenciais.
 */
export class PostSummaryDto {
    @ApiProperty({ description: 'ID único do post.', example: 'm87r1mcb' })
    @IsString()
    postId: string;

    @ApiProperty({ description: 'Título principal do post.', example: 'Desvendando o Cache no NestJS' })
    @IsString()
    title: string;

    @ApiProperty({
        description: 'Uma breve descrição ou resumo do conteúdo do post.',
        example: 'Aprenda como implementar cache de forma eficiente em suas aplicações NestJS para otimizar a performance.',
        required: false // Descrição pode ser opcional dependendo do seu modelo
    })
    @IsString()
    @IsOptional() // Marcar como opcional se não for obrigatório
    description?: string;

    @ApiProperty({ description: 'Data em que o post foi (ou será) publicado (formato ISO 8601).', example: '2025-04-08T10:00:00Z' })
    @IsString() // Poderia ser @IsISO8601() para validação mais estrita
    publishDate: string;

    @ApiProperty({ description: 'Identificador único do post na URL (kebab-case).', example: 'desvendando-cache-nestjs' })
    @IsString()
    slug: string;

    @ApiProperty({ description: 'URL da imagem principal ou de destaque do post.', example: 'https://example.com/images/cache-nestjs.png', required: false })
    @IsOptional()
    @IsUrl() // Valida se é uma URL válida
    featuredImageURL?: string;

    @ApiProperty({ description: 'Status atual do post (ex: draft, published, archived).', example: 'published' })
    @IsString()
    status: string;

    @ApiProperty({ description: 'Contagem de visualizações do post.', example: 1532 })
    @IsNumber()
    views: number;
}