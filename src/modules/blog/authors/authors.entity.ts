import { DynamoDBTable } from '@nestjs/aws-dynamodb';
import { Attribute, HashKey, RangeKey, Table } from 'dynamodb-data-mapper-annotations';
import { Exclude, Expose } from 'class-transformer';

/**
 * Entidade que representa um autor no sistema
 * @remarks
 * - Partition Key: AUTHOR#id
 * - Sort Key: PROFILE
 * - Índices Globais: GSI_Slug, GSI_RecentAuthors
 */
@Exclude()
@Table('blog-table')
export class AuthorEntity {
  @Expose()
  @HashKey({ attributeName: 'AUTHOR#id' })
  id: string;

  @Expose()
  @RangeKey({ attributeName: 'PROFILE' })
  profile: string = 'PROFILE';

  @Expose()
  @Attribute()
  name: string;

  @Expose()
  @Attribute()
  email: string;

  @Expose()
  @Attribute()
  slug: string;

  @Expose()
  @Attribute()
  bio: string;

  @Expose()
  @Attribute({ attributeName: 'profile_picture_url' })
  profilePictureUrl: string;

  @Expose()
  @Attribute({ attributeName: 'meta_description' })
  metaDescription: string;

  @Expose()
  @Attribute({ attributeName: 'social_links' })
  socialLinks: Record<string, string>;

  @Expose()
  @Attribute({ attributeName: 'created_at' })
  createdAt: string;

  @Expose()
  @Attribute({ attributeName: 'updated_at' })
  updatedAt: string;

  @Expose()
  @Attribute()
  type: string = 'AUTHOR';

  // GSI_Slug (slug, type)
  @Expose()
  @Attribute()
  @DynamoDBIndexHashKey('GSI_Slug')
  gsiSlug: string;

  @Expose()
  @DynamoDBIndexRangeKey('GSI_Slug')
  @Attribute()
  gsiSlugType: string = 'AUTHOR';

  // GSI_RecentAuthors (type, created_at)
  @Expose()
  @Attribute()
  @DynamoDBIndexHashKey('GSI_RecentAuthors')
  gsiRecentType: string = 'AUTHOR';

  @Expose()
  @DynamoDBIndexRangeKey('GSI_RecentAuthors')
  @Attribute({ attributeName: 'created_at' })
  gsiRecentCreatedAt: string;

  constructor(partial?: Partial<AuthorEntity>) {
    if (partial) {
      Object.assign(this, partial);
      this.gsiSlug = this.slug;
      this.gsiRecentCreatedAt = this.createdAt;
    }
  }
}