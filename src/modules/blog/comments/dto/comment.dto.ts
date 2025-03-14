import { ApiProperty } from '@nestjs/swagger';

// src/modules/blog/comments/dto/comment.dto.ts
export class CommentDto {
    @ApiProperty({ description: 'ID do post' })
    postId: string;

    @ApiProperty({ description: 'ID do comentário' })
    commentId: string;

    @ApiProperty({ description: 'Conteúdo do comentário' })
    content: string;

    @ApiProperty({ description: 'Data do comentário' })
    date: string;

    @ApiProperty({ description: 'Status do comentário' })
    status: string;
}