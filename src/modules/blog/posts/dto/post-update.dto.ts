/**
 * DTO para atualização de um post.
 * Extende a classe PostBaseDto para reutilizar propriedades comuns.
 */
import { IsNumber, IsOptional, IsISO8601, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PostBaseDto } from './post-base.dto';

export class PostUpdateDto extends PostBaseDto {
    /**
     * Data de modificação do post em formato ISO 8601.
     * @example '2024-09-20T12:00:00Z'
     */
    @ApiPropertyOptional({ description: 'Data de modificação (ISO 8601)', example: '2024-09-20T12:00:00Z' })
    @IsISO8601()
    @IsOptional()
    modifiedDate?: string = new Date().toISOString(); // Define um valor padrão para garantir a atualização

    /**
     * Número de visualizações do post.
     * @example 2500
     */
    @ApiPropertyOptional({ description: 'Número de visualizações do post', example: 2500 })
    @IsNumber()
    @IsOptional()
    views?: number;

    /**
     * Tempo estimado de leitura em minutos.
     * @example 8
     */
    @ApiPropertyOptional({ description: 'Tempo estimado de leitura em minutos', example: 8 })
    @IsNumber()
    @IsOptional()
    readingTime?: number;

    /**
     * Conteúdo do post.
     * @example 'Este é o conteúdo do post.'
     */
    @ApiPropertyOptional({ description: 'Conteúdo do post', example: 'Este é o conteúdo do post.' })
    @IsOptional()
    content?: string; // Adicionada a propriedade 'content'

    /**
     * URL canônica do post.
     * @example 'https://meusite.com/blog/guia-definitivo-apis-nestjs'
     */
    @ApiPropertyOptional({ description: 'URL canônica do post', example: 'https://meusite.com/blog/guia-definitivo-apis-nestjs' })
    @IsString()
    @IsOptional()
    canonical?: string;

    /**
     * Conteúdo HTML do post.
     */
    @ApiPropertyOptional({ description: 'Conteúdo HTML do post' })
    @IsString()
    @IsOptional()
    contentHTML?: string;
}