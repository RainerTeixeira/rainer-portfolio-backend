/**
 * DTO para resumo de um post.
 */
import { IsString, IsUrl } from 'class-validator'; // Removidos IsArray e IsOptional
import { ApiProperty } from '@nestjs/swagger';

export class PostSummaryDto {
    /**
     * Título do post.
     * @example 'Guia Definitivo: Construindo APIs Escaláveis com NestJS'
     */
    @ApiProperty({ description: 'Título do post', example: 'Guia Definitivo: Construindo APIs Escaláveis com NestJS' })
    @IsString()
    title: string;

    /**
     * URL da imagem destacada do post.
     * @example 'url-imagem-destaque-nestjs.jpg'
     */
    @ApiProperty({ description: 'URL da imagem destacada', example: 'url-imagem-destaque-nestjs.jpg' })
    @IsUrl()
    featuredImageURL: string;

    /**
     * Descrição breve do post.
     * @example 'Descubra como utilizar NestJS para desenvolver APIs escaláveis...'
     */
    @ApiProperty({ description: 'Descrição breve do post', example: 'Descubra como utilizar NestJS para desenvolver APIs escaláveis...' })
    @IsString()
    description: string;
}