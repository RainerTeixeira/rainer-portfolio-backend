// src/modules/blog/posts/dto/post-content.dto.ts

/**
 * DTO para transportar apenas o contentHTML de um Post.
 * Simplifica a transferência de dados para o frontend quando
 * apenas o conteúdo HTML do post é necessário para exibição.
 */
export class PostContentDto {
    contentHTML: string;

    constructor(contentHTML: string) {
        this.contentHTML = contentHTML;
    }
}