/**
 * @file create-subcategory.dto.ts
 * @description
 * DTO utilizado para validação e transferência de dados na criação de uma nova subcategoria.
 * Estende o DTO base e adiciona campos obrigatórios para identificação e data de criação.
 */
// create-subcategory.dto.ts
import { BaseSubcategoryDto } from './base-subcategory.dto';
import { IsNotEmpty } from 'class-validator';

export class CreateSubcategoryDto extends BaseSubcategoryDto {
  @IsNotEmpty()
  id!: string;

  @IsNotEmpty()
  created_at!: string;
}