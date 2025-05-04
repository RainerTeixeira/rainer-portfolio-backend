/**
 * @file authors.entity.ts
 * @description
 * Define a entidade Author utilizada no domínio do blog.
 * Representa os dados persistidos no DynamoDB e expostos pela API.
 * 
 * Responsabilidades:
 * - Tipar e documentar todos os campos do autor.
 * - Facilitar integração com Swagger.
 * - Fornecer construtor que normaliza e extrai o id puro.
 */

/**
 * Estrutura dos links sociais do autor.
 * Exemplo: { twitter: { S: 'https://twitter.com/autor' } }
 */
export interface AuthorSocialLinks {
  [key: string]: { S: string };
}

/**
 * Entidade que representa um autor no sistema.
 * Chave primária: Partition Key: AUTHOR#id | Sort Key: PROFILE
 */
export class AuthorEntity {
  /** Chave de partição no formato AUTHOR#id */
  'AUTHOR#id': string;

  /** Chave de classificação fixa PROFILE */
  PROFILE: string;

  /** Tipo do registro (sempre AUTHOR) */
  type: string;

  /** ID único do autor */
  id: string;

  /** Nome completo do autor */
  name: string;

  /** E-mail do autor */
  email: string;

  /** Slug para URLs amigáveis */
  slug: string;

  /** Biografia do autor */
  bio: string;

  /** URL da foto de perfil */
  profile_picture_url: string;

  /** Meta descrição para SEO */
  meta_description: string;

  /** Links sociais no formato DynamoDB */
  social_links: AuthorSocialLinks;

  /** Data de criação do registro */
  created_at: string;

  /** Data da última atualização */
  updated_at: string;

  /**
   * Inicializa a entidade AuthorEntity.
   * Extrai o id puro do campo 'AUTHOR#id' se necessário.
   */
  constructor(author: Partial<AuthorEntity>) {
    Object.assign(this, author);

    if (author['AUTHOR#id'] && typeof author['AUTHOR#id'] === 'string') {
      const match = author['AUTHOR#id'].match(/^AUTHOR#(.+)$/);
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
