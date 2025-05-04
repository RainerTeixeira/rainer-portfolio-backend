// base-subcategory.dto.ts
import { IsString, IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO base que representa a estrutura de uma subcategoria no contexto do blog.
 * 
 * Esta classe define todos os campos que compõem uma subcategoria, incluindo
 * validações e exemplos para documentação Swagger.
 * 
 * Utilizada como base para os DTOs de criação e atualização, garantindo
 * consistência e reaproveitamento de regras de validação.
 * 
 * Campos:
 * - ['SUBCAT#id']: Chave de partição única da subcategoria.
 * - METADATA: Chave de ordenação fixa.
 * - created_at: Data/hora de criação (ISO8601).
 * - updated_at: Data/hora da última atualização (ISO8601).
 * - name: Nome da subcategoria.
 * - slug: Slug amigável para URLs.
 * - description: Descrição detalhada.
 * - meta_description: Meta descrição para SEO.
 * - post_count: Quantidade de posts associados.
 * - parent_category_id: ID da categoria-pai.
 * - parent_category_slug: Slug da categoria-pai.
 * - type: Tipo fixo, sempre "SUBCATEGORY".
 */
export class BaseSubcategoryDto {
  @ApiProperty({ example: 'atb9az-648', description: 'Partition key: SUBCAT#<id>' })
  @IsString()
  ['SUBCAT#id']!: string;

  @ApiProperty({ example: 'METADATA', description: 'Sort key' })
  @IsString()
  METADATA!: string;

  @ApiProperty({ example: '2024-01-15T14:00:00Z', type: String, description: 'Data de criação (ISO8601)' })
  created_at!: string;

  @ApiProperty({ example: '2024-04-01T16:20:00Z', type: String, description: 'Data de atualização (ISO8601)' })
  updated_at!: string;

  @ApiProperty({ example: 'Nest Avançado' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'react-avancado' })
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiProperty({ example: 'gerenciamento de estado, performance e arquitetura.' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 'Otimização de performance e padrões de arquitetura.' })
  @IsString()
  @IsNotEmpty()
  meta_description!: string;

  @ApiProperty({ example: 22 })
  @IsInt()
  post_count!: number;

  @ApiProperty({ example: 'yjb9rz-800', description: 'ID da categoria-pai' })
  @IsString()
  @IsNotEmpty()
  parent_category_id!: string;

  @ApiProperty({ example: 'backend', description: 'Slug da categoria-pai' })
  @IsString()
  @IsNotEmpty()
  parent_category_slug!: string;

  @ApiProperty({ example: 'SUBCATEGORY', enum: ['SUBCATEGORY'] })
  @IsString()
  readonly type = 'SUBCATEGORY' as const;
}