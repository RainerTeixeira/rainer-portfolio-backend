// C:\projetos\rainer-portfolio-backend\src\modules\blog\authors\author.entity.ts
import { Attribute, HashKey, RangeKey, Table } from 'dynamodb-data-mapper-annotations';

@Table('blog-table')
export class AuthorEntity {
    @HashKey({ attributeName: 'AUTHOR#id' })
    authorId: string;

    @RangeKey({ attributeName: 'PROFILE' })
    profile: string;

    @Attribute()
    bio: string;

    @Attribute({ attributeName: 'created_at' })
    createdAt: string;

    @Attribute()
    email: string;

    @Attribute({ attributeName: 'meta_description' })
    metaDescription: string;

    @Attribute()
    name: string;

    @Attribute({ attributeName: 'profile_picture_url' })
    profilePictureUrl: string;

    @Attribute()
    slug: string;

    @Attribute({ attributeName: 'social_links' })
    socialLinks: {
        github?: string;
        linkedin?: string;
        twitter?: string;
    };

    @Attribute()
    type: string;

    @Attribute({ attributeName: 'updated_at' })
    updatedAt: string;

    // GSI_Slug
    @Attribute()
    @DynamoDBIndexHashKey('GSI_Slug')
    gsiSlug: string;

    @DynamoDBIndexRangeKey('GSI_Slug')
    @Attribute()
    gsiSlugType: string;

    // GSI_RecentAuthors
    @Attribute()
    @DynamoDBIndexHashKey('GSI_RecentAuthors')
    gsiRecentType: string;

    @DynamoDBIndexRangeKey('GSI_RecentAuthors')
    @Attribute({ attributeName: 'created_at' })
    gsiRecentCreatedAt: string;
}