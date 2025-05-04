// create-category.dto.ts
import { OmitType } from '@nestjs/swagger';
import { BaseCategoryDto } from './base-category.dto';

/**
 * Data Transfer Object (DTO) para criação de uma nova categoria de blog.
 *
 * Esta classe estende a `BaseCategoryDto`, omitindo as seguintes propriedades:
 * - `CATEGORY#id`: Chave primária, gerenciada internamente.
 * - `METADATA`: Metadados, gerenciados internamente.
 * - `pk`: Chave primária, gerenciada internamente.
 * - `sk`: Chave de ordenação, gerenciada internamente.
 * - `created_at`: Data de criação da categoria.
 * - `updated_at`: Data da última atualização da categoria.
 * - `type`: Tipo da categoria, gerenciado internamente.
 *
 * Utilize este DTO para validar e transferir dados ao criar uma nova categoria,
 * garantindo que apenas os campos necessários sejam fornecidos pelo cliente.
 */
export class CreateCategoryDto extends OmitType(BaseCategoryDto, [
  'CATEGORY#id',
  'METADATA',
  'pk',
  'sk',
  'created_at',
  'updated_at',
  'type',
] as const) { }
