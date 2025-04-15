import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SubcategoryEntity {
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
  post_count: number;

  @Expose()
  parent_category_id: string;

  @Expose()
  parent_category_slug: string;

  @Expose()
  meta_description: string;

  @Expose()
  created_at: string;

  @Expose()
  updated_at: string;

  @Expose()
  type = 'SUBCATEGORY';

  constructor(partial: Partial<SubcategoryEntity>) {
    Object.assign(this, partial);
    this.generateCompositeKeys();
  }

  private generateCompositeKeys(): void {
    if (!this.id || !this.parent_category_id) {
      throw new Error('ID e parent_category_id são obrigatórios');
    }
    this._pk = `SUBCAT#${this.parent_category_id}#${this.id}`;
  }

  toDynamoItem(): Record<string, any> {
    return {
      pk: { S: this._pk },
      sk: { S: this._sk },
      id: { S: this.id },
      name: { S: this.name },
      slug: { S: this.slug },
      description: { S: this.description },
      post_count: { N: this.post_count.toString() },
      parent_category_id: { S: this.parent_category_id },
      parent_category_slug: { S: this.parent_category_slug },
      meta_description: { S: this.meta_description },
      created_at: { S: this.created_at },
      updated_at: { S: this.updated_at },
      type: { S: this.type }
    };
  }
}