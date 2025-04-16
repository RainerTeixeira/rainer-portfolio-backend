import {
    DynamoDBTable,
    DynamoDBHashKey,
    DynamoDBRangeKey,
    DynamoDBAttribute,
    DynamoDBGlobalSecondaryIndex,
} from '@nestjs/aws-dynamodb';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
@DynamoDBTable('Comments') // usa o valor real da variável .env
export class CommentEntity {
    /**
     * Chave primária:
     *  - Partition Key: COMMENT#postId
     *  - Sort Key: TIMESTAMP (ISO string do timestamp)
     */
    @Expose()
    @DynamoDBHashKey({ name: 'COMMENT#postId' })
    pk: string;

    @Expose()
    @DynamoDBRangeKey({ name: 'TIMESTAMP' })
    sk: string;

    /**
     * Atributos principais
     */
    @Expose()
    @DynamoDBAttribute({ name: 'post_id' })
    postId: string;

    @Expose()
    @DynamoDBAttribute({ name: 'user_id' })
    userId: string;

    @Expose()
    @DynamoDBAttribute()
    text: string;

    @Expose()
    @DynamoDBAttribute()
    status: string;

    @Expose()
    @DynamoDBAttribute({ name: 'created_at' })
    createdAt: string;

    @Expose()
    @DynamoDBAttribute({ name: 'parent_comment_id' })
    parentCommentId?: string;

    @Expose()
    @DynamoDBAttribute()
    type: string = 'Comments';

    /**
     * Índice secundário global (GSI_PostComments)
     * - post_id / created_at
     */
    @DynamoDBGlobalSecondaryIndex({
        indexName: 'GSI_PostComments',
        partitionKey: { name: 'post_id' },
        sortKey: { name: 'created_at' },
    })
    gsiPostComments?: string;

    /**
     * Índice secundário global (GSI_UserComments)
     * - user_id / created_at
     */
    @DynamoDBGlobalSecondaryIndex({
        indexName: 'GSI_UserComments',
        partitionKey: { name: 'user_id' },
        sortKey: { name: 'created_at' },
    })
    gsiUserComments?: string;

    constructor(partial?: Partial<CommentEntity>) {
        Object.assign(this, partial);
    }
}
