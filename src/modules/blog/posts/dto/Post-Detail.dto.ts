import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsArray,
    IsUrl,
    IsISO8601,
    IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PostDetailDto {
    @ApiProperty({
        description: 'ID único do post',
        example: '550e8400-e29b-41d4-a716-446655440003',
    })
    @IsUUID()
    postId: string;

    @ApiProperty({
        description: 'ID da categoria',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsUUID()
    categoryId: string;

    @ApiProperty({
        description: 'ID da subcategoria',
        example: '550e8400-e29b-41d4-a716-446655440001',
    })
    @IsUUID()
    subcategoryId: string;

    @ApiProperty({
        description: 'Título do post',
        example: 'Título do Post',
    })
    @IsString()
    title: string;

    @ApiProperty({
        description: 'Conteúdo HTML do post',
        example: '<h1>Título do Post</h1><p>Conteúdo do post...</p>',
    })
    @IsString()
    contentHTML: string;

    @ApiProperty({
        description: 'ID do autor',
        example: '550e8400-e29b-41d4-a716-446655440002',
    })
    @IsUUID()
    authorId: string;

    @ApiProperty({
        description: 'Slug único para URL',
        example: 'titulo-do-post',
    })
    @IsString()
    slug: string;

    @ApiPropertyOptional({
        description: 'URL da imagem destacada',
        example: 'https://example.com/image.jpg',
    })
    @IsUrl()
    @IsOptional()
    featuredImageURL?: string;

    @ApiProperty({
        description: 'Descrição do post',
        example: 'Descrição do post',
    })
    @IsString()
    description: string;

    @ApiProperty({
        description: 'Data de publicação no formato ISO 8601',
        example: '2024-01-01T12:00:00Z',
    })
    @IsISO8601()
    publishDate: string;

    @ApiProperty({
        description: 'Tempo estimado de leitura em minutos',
        example: 5,
    })
    @IsNumber()
    readingTime: number;

    @ApiProperty({
        description: 'Número de visualizações',
        example: 100,
    })
    @IsNumber()
    views: number;

    @ApiProperty({
        description: 'Status do post',
        example: 'published',
    })
    @IsString()
    status: string;

    @ApiProperty({
        description: 'Tags associadas ao post',
        example: ['tecnologia', 'programação'],
        type: [String],
    })
    @IsArray()
    @IsString({ each: true })
    tags: string[];

    @ApiProperty({
        description: 'Palavras-chave para SEO',
        example: ['tecnologia', 'programação'],
        type: [String],
    })
    @IsArray()
    @IsString({ each: true })
    keywords: string[];

    @ApiPropertyOptional({
        description: 'URL canônica para SEO',
        example: 'https://meusite.com/blog/titulo-do-post',
    })
    @IsUrl()
    @IsOptional()
    canonical?: string;
}