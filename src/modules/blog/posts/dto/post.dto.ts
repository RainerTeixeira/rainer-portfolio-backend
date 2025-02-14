// src/modules/blog/posts/dto/post.dto.ts

export class PostDto {
    'categoryId#subcategoryId': string; // Chave de Partição composta (categoryId#subcategoryId) - String
    postId: string; // Chave de Classificação (postId) - String
    categoryId: string;
    subcategoryId: string;
    contentHTML: string;
    postInfo: { // Map aninhado
        authorId?: string;
        tags?: string[];
        likes?: number;
        views?: number;
    };
    excerpt: string;
    publishDate: string;
    slug: string;
    title: string;
    status?: string; // Ex: "draft", "published", etc.
    seo: { // Map aninhado
        canonical?: string;
        description?: string;
        keywords?: string[];
    };

    constructor(
        categoryIdSubcategoryId: string,
        postId: string,
        categoryId: string,
        subcategoryId: string,
        contentHTML: string,
        postInfo: { authorId?: string; tags?: string[]; likes?: number; views?: number },
        excerpt: string,
        publishDate: string,
        slug: string,
        title: string,
        status?: string,
        seo: { canonical?: string; description?: string; keywords?: string[] }
    ) {
        this['categoryId#subcategoryId'] = categoryIdSubcategoryId; // Usando index signature para chave composta
        this.postId = postId;
        this.categoryId = categoryId;
        this.subcategoryId = subcategoryId;
        this.contentHTML = contentHTML;
        this.postInfo = postInfo;
        this.excerpt = excerpt;
        this.publishDate = publishDate;
        this.slug = slug;
        this.title = title;
        this.status = status;
        this.seo = seo;
    }
}