import { Exclude, Expose } from 'class-transformer';

/**
 * Entidade que representa uma categoria no DynamoDB
 * @remarks Mapeia a estrutura da tabela e índices globais
 */
@Exclude()
export class CategoryEntity {
  @Expose({ name: 'pk' })
  private _pk: string;

  @Expose({ name: 'sk' })
  private _sk = 'METADATA';

  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  description: string;

  @Expose()
  keywords: string[];

  @Expose()
  post_count: number;

  @Expose()
  meta_description: string;

  @Expose()
  created_at: string;

  @Expose()
  updated_at: string;

  @Expose()
  type = 'CATEGORY';

  constructor(partial: Partial<CategoryEntity>) {
    Object.assign(this, partial);
    this.generateCompositeKeys();
  }

  private generateCompositeKeys(): void {
    if (!this.id) throw new Error('ID é obrigatório');
    this._pk = `CATEGORY#${this.id}`;
  }

  /**
   * Converte para formato DynamoDB
   */
  toDynamoItem(): Record<string, any> {
    return {
      pk: { S: this._pk },
      sk: { S: this._sk },
      id: { S: this.id },
      name: { S: this.name },
      slug: { S: this.slug },
      description: { S: this.description },
      keywords: { SS: this.keywords },
      post_count: { N: this.post_count.toString() },
      meta_description: { S: this.meta_description },
      created_at: { S: this.created_at },
      updated_at: { S: this.updated_at },
      type: { S: this.type }
    };
  }
}