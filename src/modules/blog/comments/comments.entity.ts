import { Exclude, Expose } from 'class-transformer';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

@Exclude()
export class CommentEntity {
    // Partition Key: COMMENT#postId
    @Expose()
    pk: string; // Formato: "COMMENT#postId"

    // Sort Key: TIMESTAMP (ISO string)
    @Expose()
    sk: string; // Exemplo: "2024-01-01T00:00:00.000Z"

    // Atributos principais
    @Expose()
    postId: string;

    @Expose()
    userId: string;

    @Expose()
    text: string;

    @Expose()
    status: string;

    @Expose()
    createdAt: string;

    @Expose()
    parentCommentId?: string;

    @Expose()
    type: string = 'Comments';

    // Índice Secundário Global (GSI_PostComments)
    @Expose()
    gsiPostComments?: string; // Formato: "post_id#postId#created_at#timestamp"

    // Índice Secundário Global (GSI_UserComments)
    @Expose()
    gsiUserComments?: string; // Formato: "user_id#userId#created_at#timestamp"

    constructor(partial?: Partial<CommentEntity>) {
        if (partial) {
            Object.assign(this, partial);
            // Gera PK/SK automaticamente se não fornecidas
            if (!partial.pk && partial.postId) {
                this.pk = `COMMENT#${partial.postId}`;
            }
            if (!partial.sk && partial.createdAt) {
                this.sk = partial.createdAt; // Assume que createdAt é um timestamp ISO
            }
        }
    }

    // Getter para timestamp (extrai do SK)
    get timestamp(): string {
        return this.sk;
    }

    // Getter para postId (remove o prefixo da PK)
    get cleanPostId(): string {
        return this.pk?.replace('COMMENT#', '') ?? '';
    }

    // Serialização para DynamoDB
    static toDynamoDB(comment: CommentEntity): Record<string, AttributeValue> {
        return marshall({
            ...comment,
            gsiPostComments: `post_id#${comment.postId}#created_at#${comment.createdAt}`,
            gsiUserComments: `user_id#${comment.userId}#created_at#${comment.createdAt}`
        });
    }

    // Desserialização do DynamoDB
    static fromDynamoDB(dynamoItem: Record<string, AttributeValue>): CommentEntity {
        const unmarshalled = unmarshall(dynamoItem);
        return new CommentEntity({
            ...unmarshalled,
            postId: unmarshalled.postId,
            userId: unmarshalled.userId,
            createdAt: unmarshalled.createdAt
        });
    }
}