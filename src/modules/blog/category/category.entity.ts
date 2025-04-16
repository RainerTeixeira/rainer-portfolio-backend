import {
  DynamoDBTable,
  DynamoDBHashKey,
  DynamoDBRangeKey,
  DynamoDBAttribute,
  DynamoDBGlobalSecondaryIndex,
} from '@nestjs/aws-dynamodb';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
@DynamoDBTable('Category') // Nome da tabela no .env: DYNAMO_TABLE_NAME_CATEGORIES
export class CategoryEntity {
  /**
   * PK: CATEGORY#id
   * SK: METADATA
   */
  @Expose()
  @DynamoDBHashKey({ name: 'CATEGORY#id' })
  pk: string;

  @Expose()
  @DynamoDBRangeKey({ name: 'METADATA' })
  sk: string = 'METADATA';

  @Expose()
  @DynamoDBAttribute()
  name: string;

  @Expose()
  @DynamoDBAttribute()
  slug: string;

  @Expose()
  @DynamoDBAttribute()
  description: string;

  @Expose()
  @DynamoDBAttribute()
  keywords: string[];

  @Expose()
  @DynamoDBAttribute({ name: 'post_count' })
  postCount: number;

  @Expose()
  @DynamoDBAttribute({ name: 'meta_description' })
  metaDescription: string;

  @Expose()
  @DynamoDBAttribute({ name: 'created_at' })
  createdAt: string;

  @Expose()
  @DynamoDBAttribute({ name: 'updated_at' })
  updatedAt: string;

  @Expose()
  @DynamoDBAttribute()
  type: string = 'CATEGORY';

  /**
   * GSI_Slug: slug + type
   */
  @DynamoDBGlobalSecondaryIndex({
    indexName: 'GSI_Slug',
    partitionKey: { name: 'slug' },
    sortKey: { name: 'type' },
  })
  gsiSlug?: string;

  /**
   * GSI_Popular: type + post_count
   */
  @DynamoDBGlobalSecondaryIndex({
    indexName: 'GSI_Popular',
    partitionKey: { name: 'type' },
    sortKey: { name: 'post_count' },
  })
  gsiPopular?: number;

  constructor(partial?: Partial<CategoryEntity>) {
    if (partial) {
      Object.assign(this, partial);
      // Autoajuste das chaves caso o `id` venha separado
      if (!partial.pk && partial.id) {
        this.pk = `CATEGORY#${partial.id}`;
      }
    }
  }

  // Getter virtual para acessar ID sem o prefixo
  get id(): string {
    return this.pk?.replace('CATEGORY#', '') ?? '';
  }

  // Setter virtual (caso queira criar com apenas id)
  set id(value: string) {
    this.pk = `CATEGORY#${value}`;
  }
}
