import { PartialType, OmitType } from '@nestjs/swagger';
import { BaseCategoryDto } from './base-category.dto';

/**
 * DTO para atualização de categorias no módulo de blog.
 * 
 * Esta classe estende `PartialType` aplicado ao `OmitType` de `BaseCategoryDto`,
 * excluindo os campos 'pk', 'sk', 'created_at' e 'type', tornando todos os demais campos opcionais.
 * 
 * Utilizada para operações de atualização parcial de categorias, garantindo que apenas
 * os campos permitidos possam ser modificados.
 */
export class UpdateCategoryDto extends PartialType(
  OmitType(BaseCategoryDto, ['pk', 'sk', 'created_at', 'type'] as const),
) { }
