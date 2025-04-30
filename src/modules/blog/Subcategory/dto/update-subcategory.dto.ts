/**
 * @file update-subcategory.dto.ts
 * @description
 * DTO utilizado para validação e transferência de dados na atualização de uma subcategoria existente.
 * Estende o DTO base e adiciona campo obrigatório para data de atualização.
 */
// update-subcategory.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { BaseSubcategoryDto } from './base-subcategory.dto';
import { IsNotEmpty } from 'class-validator';

export class UpdateSubcategoryDto extends PartialType(BaseSubcategoryDto) {
  @IsNotEmpty()
  updated_at!: string;
}