import { DynamoDBTable } from '@nestjs/aws-dynamodb';
import { Attribute, HashKey, RangeKey, Table } from 'dynamodb-data-mapper-annotations';
import { Exclude, Expose } from 'class-transformer';

/**
 * Entidade que representa uma categoria de conteúdo
 * @remarks
 * - Partition Key: CATEGORY#id
 * - Sort Key: METADATA
 * - Índices Globais: GSI_Slug, GSI_Popular
 */
@Exclude()
@Table('blog-table')
export class CategoryEntity {
  @Expose()
  @HashKey({ attributeName: 'CATEGORY#id' })
  id: string;

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
  @Attribute()
  keywords: string[];

  @Expose()
  @Attribute({ attributeName: 'post_count' })
  postCount: number;

  @Expose()
  @Attribute({ attributeName: 'meta_description' })
  metaDescription: string;

  @Expose()
  @Attribute({ attributeName: 'created_at' })
  createdAt: string;

  @Expose()
  @Attribute({ attributeName: 'updated_at' })
  updatedAt: string;

  @Expose()
  @Attribute()
  type: string = 'CATEGORY';

  // GSI_Slug (slug, type)
  @Expose()
  @Attribute()
  @DynamoDBIndexHashKey('GSI_Slug')
  gsiSlug: string;

  @Expose()
  @DynamoDBIndexRangeKey('GSI_Slug')
  @Attribute()
  gsiSlugType: string = 'CATEGORY';

  // GSI_Popular (type, post_count)
  @Expose()
  @Attribute()
  @DynamoDBIndexHashKey('GSI_Popular')
  gsiPopularType: string = 'CATEGORY';

  @Expose()
  @DynamoDBIndexRangeKey('GSI_Popular')
  @Attribute({ attributeName: 'post_count' })
  gsiPopularPostCount: number;

  constructor(partial?: Partial<CategoryEntity>) {
    if (partial) {
      Object.assign(this, partial);
      this.gsiSlug = this.slug;
      this.gsiPopularPostCount = this.postCount;
    }
  }
}