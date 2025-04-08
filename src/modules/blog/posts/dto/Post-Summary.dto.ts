// src/modules/blog/posts/dto/post-summary.dto.ts

import { IsString, IsUrl, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * @dto PostSummaryDto
 * @description Data Transfer Object para representar um resumo de um post,
 * frequentemente usado em listagens. Contém apenas os campos essenciais.
 */
export class PostSummaryDto {
    @ApiProperty({ description: 'ID do post' })
    @IsString()
    postId: string;

    @ApiProperty({ description: 'Título do post' })
    @IsString()
    title: string;

    @ApiProperty({ description: 'Descrição do post', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'Data de publicação do post' })
    @IsString()
    publishDate: string;

    @ApiProperty({ description: 'Slug do post' })
    @IsString()
    slug: string;

    @ApiProperty({ description: 'URL da imagem destacada', required: false })
    @IsOptional()
    @IsUrl()
    featuredImageURL?: string;

    @ApiProperty({ description: 'Status do post' })
    @IsString()
    status: string;

    @ApiProperty({ description: 'Número de visualizações do post' })
    @IsNumber()
    views: number;
}