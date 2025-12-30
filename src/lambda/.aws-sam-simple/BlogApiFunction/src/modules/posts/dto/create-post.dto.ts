/**
 * @fileoverview DTO de criação de post
 *
 * Define o payload aceito para criação de posts.
 *
 * Observações de domínio:
 * - `slug` pode ser gerado automaticamente pelo service caso não seja fornecido.
 * - `status` normalmente inicia em `DRAFT`.
 * - `publishedAt` pode ser definido quando o post já nasce publicado, mas também
 *   pode ser setado em uma ação de publish.
 *
 * @module modules/posts/dto/create-post.dto
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Payload para criação de post.
 */
export class CreatePostDto {
  @ApiProperty({
    description: 'Título do post',
    example: 'Como construir uma API RESTful com NestJS',
  })
  title: string;

  @ApiProperty({
    description: 'Slug URL-friendly do post',
    example: 'como-construir-api-restful-nestjs',
  })
  slug: string;

  @ApiProperty({
    description: 'Conteúdo completo do post em HTML ou Markdown',
    example: '<p>Conteúdo do post...</p>',
  })
  content: string;

  @ApiPropertyOptional({
    description: 'Resumo do post (gerado automaticamente se não informado)',
    example: 'Aprenda a construir APIs RESTful robustas usando NestJS.',
  })
  excerpt?: string;

  @ApiPropertyOptional({
    description: 'URL da imagem de capa',
    example: 'https://example.com/images/capa.jpg',
  })
  coverImage?: string;

  @ApiProperty({
    description: 'ID do autor do post',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  authorId: string;

  @ApiPropertyOptional({
    description: 'ID da subcategoria do post',
    example: 'subcat-123456',
  })
  subcategoryId?: string;

  @ApiPropertyOptional({
    description: 'ID da categoria do post (legacy)',
    example: 'cat-123456',
  })
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Status do post',
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    example: 'DRAFT',
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

  @ApiPropertyOptional({
    description: 'Se o post é destacado (novo campo)',
    example: false,
  })
  featured?: boolean;

  @ApiPropertyOptional({
    description: 'Se permite comentários',
    example: true,
  })
  allowComments?: boolean;

  @ApiPropertyOptional({
    description: 'Se o post está fixado',
    example: false,
  })
  pinned?: boolean;

  @ApiPropertyOptional({
    description: 'Prioridade do post',
    example: 0,
  })
  priority?: number;
}
