// src/modules/blog/comments/dto/comment.dto.ts
export class CommentDto {
    postId: string;
    commentId: string;
    content: string;
    date: string;
    status: string;
}