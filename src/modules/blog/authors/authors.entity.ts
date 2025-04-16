import { ApiProperty } from '@nestjs/swagger';

/**
 * @AuthorSocialLinks
 *
 * Interface que define a estrutura dos links sociais de um autor.
 * Utilizada para tipar o campo `social_links` na entidade {@link AuthorEntity}.
 */
export interface AuthorSocialLinks {
  [key: string]: { S: string };
}

/**
 * @AuthorEntity
 *
 * Entidade que representa um autor no sistema.
 * Define a estrutura dos dados de um autor, incluindo informações pessoais, links sociais e metadados.
 * 
 * Chave primária:
 * Partition Key: AUTHOR#id
 * Sort Key: PROFILE
 * 
 * Meta descrição para SEO: Descrição do autor para motores de busca.
 * 
 */
export class AuthorEntity {
  @ApiProperty({ description: 'Chave de partição no formato AUTHOR#id' })
  'AUTHOR#id': string;

  @ApiProperty({ description: 'Chave de classificação fixa PROFILE' })
  PROFILE: string;

  @ApiProperty({ description: 'Tipo do registro (AUTHOR)' })
  type: string;

  @ApiProperty({ description: 'ID único do autor' })
  id: string;

  @ApiProperty({ description: 'Nome completo do autor' })
  name: string;

  @ApiProperty({ description: 'E-mail do autor' })
  email: string;

  @ApiProperty({ description: 'Slug para URLs amigáveis' })
  slug: string;

  @ApiProperty({ description: 'Biografia do autor' })
  bio: string;

  @ApiProperty({ description: 'URL da foto de perfil' })
  profile_picture_url: string;

  @ApiProperty({ description: 'Meta descrição para SEO' })
  meta_description: string;

  @ApiProperty({
    description: 'Links sociais no formato DynamoDB',
    type: 'object',
    additionalProperties: {
      type: 'object',
      properties: { S: { type: 'string' } }
    }
  })
  social_links: AuthorSocialLinks;

  @ApiProperty({ description: 'Data de criação do registro' })
  created_at: string;

  @ApiProperty({ description: 'Data da última atualização' })
  updated_at: string;

  /**
   * Construtor da classe AuthorEntity.
   * @param author - Objeto contendo os dados do autor a serem atribuídos à entidade.
   */
  constructor(author: Partial<AuthorEntity>) {
    Object.assign(this, author);
    this['AUTHOR#id'] = `AUTHOR#${author.id}`;
    this.PROFILE = 'PROFILE';
    this.type = 'AUTHOR';
  }
}