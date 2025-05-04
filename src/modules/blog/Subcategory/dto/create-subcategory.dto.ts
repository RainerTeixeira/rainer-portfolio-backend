// create-subcategory.dto.ts
import { OmitType } from '@nestjs/swagger';
import { BaseSubcategoryDto } from './base-subcategory.dto';

/**
 * DTO utilizado para a criação de uma nova subcategoria.
 * 
 * Herda do DTO base, omitindo campos que são gerenciados internamente pelo sistema,
 * como identificadores, metadados e timestamps.
 * 
 * Deve ser utilizado nos endpoints de criação, garantindo que apenas os campos
 * necessários sejam fornecidos pelo usuário.
 */
export class CreateSubcategoryDto extends OmitType(
  BaseSubcategoryDto,
  ['SUBCAT#id', 'METADATA', 'created_at', 'updated_at', 'type'] as const,
) { }
