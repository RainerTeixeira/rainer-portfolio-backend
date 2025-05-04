// update-subcategory.dto.ts
import { PartialType, OmitType } from '@nestjs/swagger';
import { BaseSubcategoryDto } from './base-subcategory.dto';

/**
 * DTO utilizado para atualização parcial de subcategorias.
 * 
 * Permite que apenas campos modificáveis sejam atualizados, excluindo identificadores,
 * metadados e campos de controle interno.
 * 
 * Utiliza PartialType para tornar todos os campos opcionais, facilitando atualizações parciais.
 */

/**
 * DTO para atualização parcial de subcategorias no módulo de blog.
 *
 * Estende `PartialType` aplicado ao `OmitType` de `BaseSubcategoryDto`, excluindo
 * campos não modificáveis internamente: ['SUBCAT#id', 'METADATA', 'created_at', 'type']
 */
export class UpdateSubcategoryDto extends PartialType(
  OmitType(BaseSubcategoryDto, ['SUBCAT#id', 'METADATA', 'created_at', 'type'] as const),
) { }