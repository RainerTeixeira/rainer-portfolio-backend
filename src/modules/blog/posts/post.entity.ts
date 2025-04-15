import { DynamoDBTable } from '@nestjs/aws-dynamodb';
import { Attribute, HashKey, RangeKey, Table } from 'dynamodb-data-mapper-annotations';
import { Exclude, Expose } from 'class-transformer';

/**
 * Entidade que representa um post de blog
 * @remarks
 * - Partition Key: POST#id
 * - Sort Key: METADATA
 * - Índices Globais: GSI_AuthorPosts, GSI_CategoryPosts, GSI_RecentPosts, GSI_Slug
 */
@Exclude()
@Table('blog-table')
export class PostEntity {
    @Expose()
    @HashKey({ attributeName: 'POST#id' })
    id: string;

    @Expose()
    @RangeKey({ attributeName: 'METADATA' })
    metadata: string = 'METADATA';

    @Expose()
    @Attribute({ attributeName: 'author_id' })
    authorId: string;

    @Expose()
    @Attribute({ attributeName: 'category_id' })
    categoryId: string;

    @Expose()
    @Attribute({ attributeName: 'comment_count' })
    commentCount: number;

    @Expose()
    @Attribute()
    content: string;

    @Expose()
    @Attribute({ attributeName: 'created_at' })
    createdAt: string;

    @Expose()
    @Attribute()
    excerpt: string;

    @Expose()
    @Attribute({ attributeName: 'last_updated_date' })
    lastUpdatedDate: string;

    @Expose()
    @Attribute()
    likes: number;

    @Expose()
    @Attribute({ attributeName: 'meta_description' })
    metaDescription: string;

    @Expose()
    @Attribute({ attributeName: 'og_description' })
    ogDescription: string;

    @Expose()
    @Attribute({ attributeName: 'og_image' })
    ogImage: string;

    @Expose()
    @Attribute({ attributeName: 'og_title' })
    ogTitle: string;

    @Expose()
    @Attribute({ attributeName: 'post_picture_url' })
    postPictureUrl: string;

    @Expose()
    @Attribute({ attributeName: 'publish_date' })
    publishDate: string;

    @Expose()
    @Attribute()
    slug: string;

    @Expose()
    @Attribute()
    status: string;

    @Expose()
    @Attribute()
    subcategory: string;

    @Expose()
    @Attribute()
    tags: string[];

    @Expose()
    @Attribute()
    title: string;

    @Expose()
    @Attribute()
    type: string = 'POST';

    @Expose()
    @Attribute()
    views: number;

    // GSI_AuthorPosts (author_id, publish_date)
    @Expose()
    @Attribute({ attributeName: 'author_id' })
    @DynamoDBIndexHashKey('GSI_AuthorPosts')
    gsiAuthorId: string;

    @Expose()
    @DynamoDBIndexRangeKey('GSI_AuthorPosts')
    @Attribute({ attributeName: 'publish_date' })
    gsiAuthorPublishDate: string;

    // GSI_CategoryPosts (category_id, views)
    @Expose()
    @Attribute({ attributeName: 'category_id' })
    @DynamoDBIndexHashKey('GSI_CategoryPosts')
    gsiCategoryId: string;

    @Expose()
    @DynamoDBIndexRangeKey('GSI_CategoryPosts')
    @Attribute()
    gsiCategoryViews: number;

    // GSI_RecentPosts (type, publish_date)
    @Expose()
    @Attribute()
    @DynamoDBIndexHashKey('GSI_RecentPosts')
    gsiRecentType: string = 'POST';

    @Expose()
    @DynamoDBIndexRangeKey('GSI_RecentPosts')
    @Attribute({ attributeName: 'publish_date' })
    gsiRecentPublishDate: string;

    // GSI_Slug (slug, type)
    @Expose()
    @Attribute()
    @DynamoDBIndexHashKey('GSI_Slug')
    gsiSlug: string;

    @Expose()
    @DynamoDBIndexRangeKey('GSI_Slug')
    @Attribute()
    gsiSlugType: string = 'POST';

    constructor(partial?: Partial<PostEntity>) {
        if (partial) {
            Object.assign(this, partial);
            this.gsiAuthorId = this.authorId;
            this.gsiAuthorPublishDate = this.publishDate;
            this.gsiCategoryId = this.categoryId;
            this.gsiCategoryViews = this.views;
            this.gsiRecentPublishDate = this.publishDate;
            this.gsiSlug = this.slug;
        }
    }
}