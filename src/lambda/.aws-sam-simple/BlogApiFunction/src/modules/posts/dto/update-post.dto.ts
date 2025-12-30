/**
 * @fileoverview DTO de atualização de post
 *
 * Define o payload aceito para atualização parcial de posts.
 *
 * Observações:
 * - Campos não enviados devem ser mantidos (merge parcial).
 * - Mudanças de `status` podem ser feitas via endpoint específico (publish/archive)
 *   ou via update, conforme regras do backend.
 *
 * @module modules/posts/dto/update-post.dto
 */

import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Payload para atualização de post.
 */
export class UpdatePostDto {
  @ApiPropertyOptional({
    description: 'Título do post',
    example: 'Como construir uma API RESTful com NestJS',
  })
  title?: string;

  @ApiPropertyOptional({
    description: 'Slug URL-friendly do post',
    example: 'como-construir-api-restful-nestjs',
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'Conteúdo completo do post em HTML ou Markdown',
    example: '<p>Conteúdo do post...</p>',
  })
  content?: string;

  @ApiPropertyOptional({
    description: 'Resumo do post',
    example: 'Aprenda a construir APIs RESTful robustas usando NestJS.',
  })
  excerpt?: string;

  @ApiPropertyOptional({
    description: 'URL da imagem de capa',
    example: 'https://example.com/images/capa.jpg',
  })
  coverImage?: string;

  @ApiPropertyOptional({
    description: 'ID da categoria do post',
    example: 'cat-123456',
  })
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Status do post',
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    example: 'PUBLISHED',
  })
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

  @ApiPropertyOptional({
    description: 'Data de publicação',
    example: '2024-01-15T10:00:00Z',
  })
  publishedAt?: Date;

  @ApiPropertyOptional({
    description: 'Lista de tags do post',
    type: [String],
    example: ['nestjs', 'api', 'backend'],
  })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Tempo estimado de leitura em minutos',
    example: 5,
  })
  readTime?: number;

  @ApiPropertyOptional({
    description: 'Se o post é destacado',
    example: false,
  })
  isFeatured?: boolean;
}
