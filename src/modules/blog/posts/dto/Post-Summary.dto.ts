// src/modules/blog/posts/dto/post-summary.dto.ts
import { IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PostSummaryDto {
    @ApiProperty({ description: 'ID do post', example: 'mbx9zi-1a3' })
    @IsString()
    postId: string;

    @ApiProperty({ description: 'Título do post', example: 'Guia Definitivo: Construindo APIs Escaláveis com NestJS' })
    @IsString()
    title: string;

    @ApiProperty({ description: 'Descrição breve do post', example: 'Descubra como utilizar NestJS para desenvolver APIs escaláveis...' })
    @IsString()
    description: string;

    @ApiProperty({ description: 'Data de publicação do post (ISO 8601)', example: '2024-09-15T10:00:00Z' })
    @IsString() // Ou IsISO8601
    publishDate: string;

    @ApiProperty({ description: 'Slug do post', example: 'guia-definitivo-apis-nestjs-13' })
    @IsString()
    slug: string;

    @ApiProperty({ description: 'URL da imagem destacada', example: 'url-imagem-destaque-nestjs.jpg' })
    @IsUrl() // Ou IsString
    featuredImageURL: string;

    @ApiProperty({ description: 'Status do post', example: 'publicado' })
    @IsString()
    status: string; // Adicionado para incluir o status do post

    @ApiProperty({ description: 'Número de visualizações do post', example: 0 })
    @IsString()
    views: number;
}