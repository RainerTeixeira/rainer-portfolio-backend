/**
 * @fileoverview DTO de atualização de categoria
 *
 * Define o payload aceito para atualização parcial (patch) de uma categoria.
 * Todos os campos são opcionais.
 *
 * @module modules/categories/dto/update-category.dto
 */

import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Payload para atualização de categoria.
 */
export class UpdateCategoryDto {
  @ApiPropertyOptional({
    description: 'Nome da categoria',
    example: 'Tecnologia',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Slug URL-friendly da categoria',
    example: 'tecnologia',
  })
  slug?: string;

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
