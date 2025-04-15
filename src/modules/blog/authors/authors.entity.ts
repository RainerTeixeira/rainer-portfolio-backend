import { Exclude, Expose } from 'class-transformer';

/**
 * Entidade que representa a estrutura de dados de um autor no DynamoDB
 * 
 * @remarks
 * - Utiliza class-transformer para controle de exposição de campos
 * - Mapeia os campos do DynamoDB para propriedades TypeScript
 */
@Exclude()
export class AuthorEntity {
  @Expose({ name: 'pk' })
  private _pk: string;

  @Expose({ name: 'sk' })
  private _sk = 'PROFILE';

  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  slug: string;

  @Expose()
  bio: string;

  @Expose()
  profile_picture_url: string;

  @Expose()
  meta_description: string;

  @Expose()
  social_links: Record<string, string>;

  @Expose()
  created_at: string;

  @Expose()
  updated_at: string;

  @Expose()
  type = 'AUTHOR';

  constructor(partial: Partial<AuthorEntity>) {
    Object.assign(this, partial);
    this.generateCompositeKeys();
  }

  /**
   * Gera as chaves compostas do DynamoDB
   */
  private generateCompositeKeys(): void {
    if (!this.id) throw new Error('ID é obrigatório para gerar chaves compostas');
    this._pk = `AUTHOR#${this.id}`;
  }

  /**
   * Serializa a entidade para o formato DynamoDB
   */
  toDynamoItem(): Record<string, any> {
    return {
      pk: { S: this._pk },
      sk: { S: this._sk },
      id: { S: this.id },
      name: { S: this.name },
      email: { S: this.email },
      slug: { S: this.slug },
      bio: { S: this.bio },
      profile_picture_url: { S: this.profile_picture_url },
      meta_description: { S: this.meta_description },
      social_links: { M: this.mapSocialLinks() },
      created_at: { S: this.created_at },
      updated_at: { S: this.updated_at },
      type: { S: this.type }
    };
  }

  /**
   * Mapeia os links sociais para o formato DynamoDB
   */
  private mapSocialLinks(): Record<string, any> {
    return Object.entries(this.social_links).reduce((acc, [key, value]) => {
      acc[key] = { S: value };
      return acc;
    }, {});
  }
}