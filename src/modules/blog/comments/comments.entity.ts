import { DynamoDBTable } from '@nestjs/aws-dynamodb';
import { Attribute, HashKey, RangeKey, Table } from 'dynamodb-data-mapper-annotations';
import { Exclude, Expose } from 'class-transformer';

/**
 * Entidade que representa um comentário em um post
 * @remarks
 * - Partition Key: COMMENT#postId
 * - Sort Key: TIMESTAMP
 * - Índices Globais: GSI_PostComments, GSI_UserComments
 */
@Exclude()
@Table('blog-table')
export class CommentEntity {
    @Expose()
    @HashKey({ attributeName: 'COMMENT#postId' })
    postId: string;

    @Expose()
    @RangeKey({ attributeName: 'TIMESTAMP' })
    timestamp: string;

    @Expose()
    @Attribute({ attributeName: 'user_id' })
    userId: string;

    @Expose()
    @Attribute()
    text: string;

    @Expose()
    @Attribute()
    status: string;

    @Expose()
    @Attribute({ attributeName: 'created_at' })
    createdAt: string;

    @Expose()
    @Attribute({ attributeName: 'parent_comment_id' })
    parentCommentId?: string;

    @Expose()
    @Attribute()
    type: string = 'COMMENT';

    // GSI_PostComments (post_id, created_at)
    @Expose()
    @Attribute({ attributeName: 'post_id' })
    @DynamoDBIndexHashKey('GSI_PostComments')
    gsiPostId: string;

    @Expose()
    @DynamoDBIndexRangeKey('GSI_PostComments')
    @Attribute({ attributeName: 'created_at' })
    gsiPostCreatedAt: string;

    // GSI_UserComments (user_id, created_at)
    @Expose()
    @Attribute({ attributeName: 'user_id' })
    @DynamoDBIndexHashKey('GSI_UserComments')
    gsiUserId: string;

    @Expose()
    @DynamoDBIndexRangeKey('GSI_UserComments')
    @Attribute({ attributeName: 'created_at' })
    gsiUserCreatedAt: string;

    constructor(partial?: Partial<CommentEntity>) {
        if (partial) {
            Object.assign(this, partial);
            this.gsiPostId = this.postId;
            this.gsiPostCreatedAt = this.createdAt;
            this.gsiUserId = this.userId;
            this.gsiUserCreatedAt = this.createdAt;
        }
    }
}