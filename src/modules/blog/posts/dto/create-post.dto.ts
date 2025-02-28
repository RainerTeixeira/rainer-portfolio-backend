// src/modules/blog/posts/dto/Create-post.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ description: 'ID da categoria do post' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ description: 'ID da subcategoria do post' })
  @IsString()
  @IsNotEmpty()
  subcategoryId: string;

  @ApiProperty({ description: 'Conteúdo HTML do post' })
  @IsString()
  @IsNotEmpty()
  contentHTML: string;

  @ApiProperty({ description: 'ID do autor do post' })
  @IsString()
  @IsNotEmpty()
  authorId: string;

  @ApiProperty({ description: 'Data de publicação (formato ISO)' })
  @IsString()
  @IsNotEmpty()
  publishDate: string;

  @ApiProperty({ description: 'Slug do post (parte da URL)' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ description: 'Título do post' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'URL da imagem destacada' })
  @IsOptional()
  @IsString()
  featuredImageURL?: string;

  @ApiPropertyOptional({ description: 'Tempo de leitura estimado em minutos' })
  @IsOptional()
  @IsNumber()
  readingTime?: number;

  @ApiPropertyOptional({ description: 'Status do post (ex: publicado, rascunho)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Tags associadas ao post', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Número de visualizações do post' })
  @IsOptional()
  @IsNumber()
  views?: number;

  @ApiPropertyOptional({ description: 'URL canônica para SEO' })
  @IsOptional()
  @IsString()
  canonical?: string;

  @ApiPropertyOptional({ description: 'Descrição para SEO' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Palavras-chave para SEO', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];
}
