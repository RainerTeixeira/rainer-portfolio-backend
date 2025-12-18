/**
 * @fileoverview DTO de criação de categoria
 *
 * Define o payload aceito para criar uma categoria.
 *
 * Campos principais:
 * - `name`: nome exibido.
 * - `slug`: identificador URL-friendly.
 * - `isActive`: indica se a categoria fica disponível para uso.
 *
 * @module modules/categories/dto/create-category.dto
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Payload para criação de categoria.
 */
export class CreateCategoryDto {
  @ApiProperty({
    description: 'Nome da categoria',
    example: 'Tecnologia',
  })
  name: string;

  @ApiProperty({
    description: 'Slug URL-friendly da categoria',
    example: 'tecnologia',
  })
  slug: string;

  @ApiPropertyOptional({
    description: 'Descrição da categoria',
    example: 'Posts sobre tecnologia e programação',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Se a categoria está ativa',
    example: true,
  })
  isActive?: boolean;
}
