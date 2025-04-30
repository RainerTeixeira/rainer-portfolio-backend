/**
 * @file base-subcategory.dto.ts
 * @description
 * DTO base que define os campos comuns para criação e atualização de subcategorias.
 * Utilizado como base para os DTOs de criação e atualização, garantindo padronização e validação dos dados.
 * 
 * Observações:
 * - Utiliza decorators do class-validator para garantir a integridade dos dados recebidos.
 */
// base-subcategory.dto.ts
import { IsString, IsNumber } from 'class-validator';

export class BaseSubcategoryDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  description: string;

  @IsNumber()
  post_count: number;

  @IsString()
  parent_category_id: string;

  @IsString()
  parent_category_slug: string;

  @IsString()
  meta_description: string;
}
