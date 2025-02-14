// src/modules/blog/posts/dto/post.dto.ts

export class PostDto {
    'categoryId#subcategoryId': string; // Chave de Partição composta (categoryId#subcategoryId) - String
    postId: string; // Chave de Classificação (postId) - String
    categoryId: string;
    subcategoryId: string;
    contentHTML: string;
    postInfo: { // Map aninhado
        authorId?: string;
        excerpt?: string;
        featuredImageURL?: string;
        modifiedDate?: string; // Formato de data ISO String
        publishDate?: string; // Formato de data ISO String
        readingTime?: number;
        slug?: string;
        status?: string;
        tags?: string[]; // Set de strings
        title?: string;
        views?: number;
    };
    seo: { // Map aninhado
        canonical?: string;
        description?: string;
        keywords?: string[]; // Set de strings
    };
}