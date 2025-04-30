/**
 * @file authors.entity.ts
 * @description
 * Define a estrutura da entidade Author utilizada no domínio do blog.
 * Representa os dados persistidos no DynamoDB e expostos pela API.
 * 
 * Principais responsabilidades:
 * - Tipar e documentar todos os campos do autor, incluindo informações pessoais, sociais e metadados.
 * - Facilitar a integração com o Swagger para documentação automática.
 * - Fornecer construtor que normaliza e extrai o id puro do campo de partição.
 * 
 * Observações:
 * - A interface AuthorSocialLinks define o formato dos links sociais do autor.
 * - A entidade é utilizada em DTOs, controllers e serviços para garantir consistência dos dados.
 */

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
 * Entidade que representa um autor no domínio do blog.
 * Utilizada para mapear os dados armazenados no DynamoDB e expor propriedades relevantes para a aplicação.
 * Inclui campos para integração com índices secundários globais (GSI) e propriedades de SEO.
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
   * Permite inicializar a entidade a partir de um objeto parcial.
   * Extrai o id puro se vier no formato 'AUTHOR#id'.
   * @param author Objeto contendo os dados do autor a serem atribuídos à entidade.
   */
  constructor(author: Partial<AuthorEntity>) {
    Object.assign(this, author);

    // Extrai o id puro se vier no formato 'AUTHOR#id'
    if (author['AUTHOR#id'] && typeof author['AUTHOR#id'] === 'string') {
      const match = (author['AUTHOR#id'] as string).match(/^AUTHOR#(.+)$/);
      this.id = match ? match[1] : author.id;
      this['AUTHOR#id'] = author['AUTHOR#id'];
    } else if (author.id) {
      this.id = author.id;
      this['AUTHOR#id'] = `AUTHOR#${author.id}`;
    }

    this.PROFILE = 'PROFILE';
    this.type = 'AUTHOR';
  }
}