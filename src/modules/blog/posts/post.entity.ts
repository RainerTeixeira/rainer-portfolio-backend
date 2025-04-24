import {
    DynamoDBTable,
    DynamoDBHashKey,
    DynamoDBRangeKey,
    DynamoDBGlobalSecondaryIndex,
    DynamoDBAttribute,
} from '@nestjs/aws-dynamodb';
import { Exclude, Expose } from 'class-transformer';

/**
 * Entidade que representa um post de blog.
 * @table blog
 * PK: POST#id
 * SK: METADATA
 */
@Exclude()
@DynamoDBTable(process.env.DYNAMO_TABLE_NAME_POSTS || 'blog') // Nome da tabela do .env ou 'blog' por padrão
export class PostEntity {
    @Expose()
    @DynamoDBHashKey({ name: 'POST#id' })
    id: string;

    @Expose()
    @DynamoDBRangeKey({ name: 'METADATA' })
    metadata: string = 'METADATA';

    @Expose()
    @DynamoDBAttribute({ name: 'author_id' })
    authorId: string;

    @Expose()
    @DynamoDBAttribute({ name: 'category_id' })
    categoryId: string;

    @Expose()
    @DynamoDBAttribute({ name: 'comment_count' })
    commentCount: number;

    @Expose()
    @DynamoDBAttribute()
    content: string;

    @Expose()
    @DynamoDBAttribute({ name: 'created_at' })
    createdAt: string;

    @Expose()
    @DynamoDBAttribute()
    excerpt: string;

    @Expose()
    @DynamoDBAttribute({ name: 'last_updated_date' })
    lastUpdatedDate: string;

    @Expose()
    @DynamoDBAttribute()
    likes: number;

    @Expose()
    @DynamoDBAttribute({ name: 'meta_description' })
    metaDescription: string;

    @Expose()
    @DynamoDBAttribute({ name: 'og_description' })
    ogDescription: string;

    @Expose()
    @DynamoDBAttribute({ name: 'og_image' })
    ogImage: string;

    @Expose()
    @DynamoDBAttribute({ name: 'og_title' })
    ogTitle: string;

    @Expose()
    @DynamoDBAttribute({ name: 'post_picture_url' })
    postPictureUrl: string;

    @Expose()
    @DynamoDBAttribute({ name: 'publish_date' })
    publishDate: string;

    @Expose()
    @DynamoDBAttribute()
    slug: string;

    @Expose()
    @DynamoDBAttribute()
    status: string;

    @Expose()
    @DynamoDBAttribute()
    subcategory: string;

    @Expose()
    @DynamoDBAttribute()
    tags: string[];

    @Expose()
    @DynamoDBAttribute()
    title: string;

    @Expose()
    @DynamoDBAttribute()
    type: string = 'POST';

    @Expose()
    @DynamoDBAttribute()
    views: number;

    // GSI_AuthorPosts: (author_id, publish_date)
    @DynamoDBGlobalSecondaryIndex({
        indexName: 'GSI_AuthorPosts',
        partitionKey: { name: 'author_id' },
        sortKey: { name: 'publish_date' },
    })

    // GSI_CategoryPosts: (category_id, views)
    @DynamoDBGlobalSecondaryIndex({
        indexName: 'GSI_CategoryPosts',
        partitionKey: { name: 'category_id' },
        sortKey: { name: 'views' },
    })

    // GSI_RecentPosts: (type, publish_date)
    @DynamoDBGlobalSecondaryIndex({
        indexName: 'GSI_RecentPosts',
        partitionKey: { name: 'type' },
        sortKey: { name: 'publish_date' },
    })

    // GSI_Slug: (slug, type)
    @DynamoDBGlobalSecondaryIndex({
        indexName: 'GSI_Slug',
        partitionKey: { name: 'slug' },
        sortKey: { name: 'type' },
    })

    constructor(partial?: Partial<PostEntity>) {
        Object.assign(this, partial);
    }
}
