import { IsString, IsISO8601, IsInt, IsArray, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Classe base DTO (Data Transfer Object) para categorias do blog.
 *
 * @property pk            Chave de partição (padrão: valor de "CATEGORY#id").
 * @property sk            Chave de ordenação (sempre "METADATA").
 * @property created_at    Timestamp de criação em ISO8601.
 * @property updated_at    Timestamp de atualização em ISO8601.
 * @property name          Nome da categoria.
 * @property slug          Slug amigável para URLs.
 * @property description   Descrição longa da categoria.
 * @property meta_description Meta descrição para SEO.
 * @property postCount     Quantidade de posts associados.
 * @property keywords      Palavras-chave da categoria.
 * @property type          Tipo fixo, sempre "CATEGORY".
 */
export class BaseCategoryDto {
  @ApiProperty({ example: 'yjb9rz-801', description: 'Partition key: CATEGORY#<id>' })
  @IsString()
  //@IsNotEmpty()
  ['CATEGORY#id']!: string;

  @ApiProperty({ example: 'METADATA', description: 'Sort key' })
  @IsString()
  //@IsNotEmpty()
  METADATA!: string;

  @ApiProperty({ example: '2024-06-01 15:23:45', type: String, description: 'Data de criação (YYYY-MM-DD HH:mm:ss)' })
  created_at!: string;

  @ApiProperty({ example: '2024-06-01 15:23:45', type: String, description: 'Data de atualização (YYYY-MM-DD HH:mm:ss)' })
  updated_at!: string;

  @ApiProperty({ example: 'arquitetura' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'arquitetura' })
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiProperty({
    example: 'Recursos e guias focados em arquitetura de software, padrões de projeto e escalabilidade.',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 'Aprenda sobre arquitetura de sistemas, microservices, clean code e mais.' })
  @IsString()
  @IsNotEmpty()
  meta_description!: string;

  @ApiProperty({ example: 19 })
  @IsInt()
  post_count!: number;

  @ApiProperty({ example: ['arquitetura', 'design patterns', 'escalabilidade', 'devops'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  keywords!: string[];

  @ApiProperty({ example: 'CATEGORY', enum: ['CATEGORY'] })
  @IsString()
  readonly type = 'CATEGORY' as const;
}
