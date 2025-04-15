import { DynamoDBTable } from '@nestjs/aws-dynamodb';
import { Attribute, HashKey, RangeKey, Table } from 'dynamodb-data-mapper-annotations';
import { Exclude, Expose } from 'class-transformer';

/**
 * Entidade que representa uma subcategoria
 * @remarks
 * - Partition Key: SUBCAT#parent#id
 * - Sort Key: METADATA
 * - Índices Globais: GSI_ParentCategory, GSI_Slug
 */
@Exclude()
@Table('blog-table')
export class SubcategoryEntity {
  @Expose()
  @HashKey({ attributeName: 'SUBCAT#parent#id' })
  parentId: string;

  @Expose()
  @RangeKey({ attributeName: 'METADATA' })
  metadata: string = 'METADATA';

  @Expose()
  @Attribute()
  name: string;

  @Expose()
  @Attribute()
  slug: string;

  @Expose()
  @Attribute()
  description: string;

  @Expose()
  @Attribute({ attributeName: 'meta_description' })
  metaDescription: string;

  @Expose()
  @Attribute({ attributeName: 'parent_category_id' })
  parentCategoryId: string;

  @Expose()
  @Attribute({ attributeName: 'parent_category_slug' })
  parentCategorySlug: string;

  @Expose()
  @Attribute({ attributeName: 'post_count' })
  postCount: number;

  @Expose()
  @Attribute({ attributeName: 'created_at' })
  createdAt: string;

  @Expose()
  @Attribute({ attributeName: 'updated_at' })
  updatedAt: string;

  @Expose()
  @Attribute()
  type: string = 'SUBCATEGORY';

  // GSI_ParentCategory (parent_category_id, created_at)
  @Expose()
  @Attribute({ attributeName: 'parent_category_id' })
  @DynamoDBIndexHashKey('GSI_ParentCategory')
  gsiParentCategoryId: string;

  @Expose()
  @DynamoDBIndexRangeKey('GSI_ParentCategory')
  @Attribute({ attributeName: 'created_at' })
  gsiParentCreatedAt: string;

  // GSI_Slug (slug, type)
  @Expose()
  @Attribute()
  @DynamoDBIndexHashKey('GSI_Slug')
  gsiSlug: string;

  @Expose()
  @DynamoDBIndexRangeKey('GSI_Slug')
  @Attribute()
  gsiSlugType: string = 'SUBCATEGORY';

  constructor(partial?: Partial<SubcategoryEntity>) {
    if (partial) {
      Object.assign(this, partial);
      this.gsiParentCategoryId = this.parentCategoryId;
      this.gsiParentCreatedAt = this.createdAt;
      this.gsiSlug = this.slug;
    }
  }
}