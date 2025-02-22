// src/modules/blog/comments/dto/comment.dto.ts

export class CommentDto {
    postId: string; // Chave de Partição (postId) - Number
    commentId: string; // Chave de Classificação (commentId ) - String
    content: string;
    date: string; // Formato de data ISO String (ex: "2025-01-12T00:00:00Z")
    status: string; // Ex: "published", "pending", etc.

    constructor(postId: number, authorId: string, content: string, date: string, status: string) {
        this.postId = postId;
        this.authorId = authorId;
        this.content = content;
        this.date = date;
        this.status = status;
    }
}