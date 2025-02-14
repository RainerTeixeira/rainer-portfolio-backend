// src/modules/blog/posts/dto/post.dto.ts

export enum PostStatus {
    DRAFT = 'draft',
    PUBLISHED = 'published',
    // ... outros status se necessário
}

export class PostDto {
    'categoryId#subcategoryId': string;
    postId: string;
    categoryId: string;
    subcategoryId: string;
    contentHTML: string;
    postInfo: {
        authorId?: string;
        tags?: string[];
        likes?: number;
        views?: number;
    };
    excerpt: string;
    publishDate: string;
    slug: string;
    title: string;
    status: PostStatus; // Agora o tipo é PostStatus
    seo: {
        canonical?: string;
        description?: string;
        keywords?: string[];
    };

    constructor(
        postId: string,
        categoryIdSubcategoryId: string,
        contentHTML: string,
        postInfo: { authorId?: string; tags?: string[] },
        excerpt: string,
        publishDate: string,
        slug: string,
        title: string,
        status: PostStatus, // status: PostStatus no construtor
        seo?: { canonical?: string; description?: string; keywords?: string[] }
    ) {
        this.postId = postId;
        this['categoryId#subcategoryId'] = categoryIdSubcategoryId;
        this.contentHTML = contentHTML;
        this.postInfo = postInfo;
        this.excerpt = excerpt;
        this.publishDate = publishDate;
        this.slug = slug;
        this.title = title;
        this.status = status;
        this.seo = seo;
        this.categoryId = categoryIdSubcategoryId.split('#')[0];
        this.subcategoryId = categoryIdSubcategoryId.split('#')[1];
    }
}