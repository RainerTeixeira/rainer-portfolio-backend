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

export class CreatePostDto {
  @ApiProperty({
    description: 'ID da categoria do post',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    description: 'ID da subcategoria do post',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsNotEmpty()
  subcategoryId: string;

  @ApiProperty({
    description: 'Conteúdo HTML do post',
    example: '<h1>Título do Post</h1><p>Conteúdo do post...</p>',
  })
  @IsString()
  @IsNotEmpty()
  contentHTML: string;

  @ApiProperty({
    description: 'ID do autor do post',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  @IsNotEmpty()
  authorId: string;

  @ApiProperty({
    description: 'Data de publicação no formato ISO 8601',
    example: '2024-01-01T12:00:00Z',
  })
  @IsISO8601()
  @IsNotEmpty()
  publishDate: string;

  @ApiProperty({
    description: 'Slug único para URL',
    example: 'titulo-do-post',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: 'Título do post',
    example: 'Título do Post',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'URL da imagem destacada',
    example: 'https://example.com/image.jpg',
  })
  @IsUrl()
  @IsOptional()
  featuredImageURL?: string;

  @ApiPropertyOptional({
    description: 'Tempo estimado de leitura em minutos',
    example: 5,
  })
  @IsNumber()
  @IsOptional()
  readingTime?: number;

  @ApiPropertyOptional({
    description: 'Status do post (ex: publicado, rascunho)',
    example: 'published',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: 'Tags associadas ao post',
    example: ['tecnologia', 'programação'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Número de visualizações do post',
    example: 100,
  })
  @IsNumber()
  @IsOptional()
  views?: number;

  @ApiPropertyOptional({
    description: 'URL canônica para SEO',
    example: 'https://meusite.com/blog/titulo-do-post',
  })
  @IsUrl()
  @IsOptional()
  canonical?: string;

  @ApiPropertyOptional({
    description: 'Descrição para SEO',
    example: 'Descrição do post para motores de busca',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Palavras-chave para SEO',
    example: ['tecnologia', 'programação'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];
}