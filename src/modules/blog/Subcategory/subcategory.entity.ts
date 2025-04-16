import {
  DynamoDBTable,
  DynamoDBHashKey,
  DynamoDBRangeKey,
  DynamoDBGlobalSecondaryIndex,
  DynamoDBAttribute,
} from '@nestjs/aws-dynamodb';
import { Exclude, Expose } from 'class-transformer';

/**
 * Entidade que representa uma subcategoria
 * @table Subcategory
 * PK: SUBCAT#parent#id
 * SK: METADATA
 */
@Exclude()
@DynamoDBTable('Subcategory') // Nome da tabela ajustado para Subcategory
export class SubcategoryEntity {
  @Expose()
  @DynamoDBHashKey({ name: 'SUBCAT#parent#id' })
  parentId: string;

  @Expose()
  @DynamoDBRangeKey({ name: 'METADATA' })
  metadata: string = 'METADATA';

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
  @DynamoDBAttribute({ name: 'meta_description' })
  metaDescription: string;

  @Expose()
  @DynamoDBAttribute({ name: 'parent_category_id' })
  parentCategoryId: string;

  @Expose()
  @DynamoDBAttribute({ name: 'parent_category_slug' })
  parentCategorySlug: string;

  @Expose()
  @DynamoDBAttribute({ name: 'post_count' })
  postCount: number;

  @Expose()
  @DynamoDBAttribute({ name: 'created_at' })
  createdAt: string;

  @Expose()
  @DynamoDBAttribute({ name: 'updated_at' })
  updatedAt: string;

  @Expose()
  @DynamoDBAttribute()
  type: string = 'SUBCATEGORY';

  // GSI_ParentCategory: (parent_category_id, created_at)
  @DynamoDBGlobalSecondaryIndex({
    indexName: 'GSI_ParentCategory',
    partitionKey: { name: 'parent_category_id' },
    sortKey: { name: 'created_at' },
  })
  gsiParentCategory?: string;

  // GSI_Slug: (slug, type)
  @DynamoDBGlobalSecondaryIndex({
    indexName: 'GSI_Slug',
    partitionKey: { name: 'slug' },
    sortKey: { name: 'type' },
  })
  gsiSlug?: string;

  constructor(partial?: Partial<SubcategoryEntity>) {
    Object.assign(this, partial);
  }
}
