// src/modules/blog/posts/dto/post.dto.ts

import { PostStatus } from './post-status.enum'; // Importe o enum PostStatus

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
    status?: string;
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
        title: string,  // title moved before status
        status: PostStatus, // status moved before seo
        seo?: { canonical?: string; description?: string; keywords?: string[] }
    ) {
        this.postId = postId;
        this['categoryId#subcategoryId'] = categoryIdSubcategoryId; // Use bracket notation for property name with special characters
        this.contentHTML = contentHTML;
        this.postInfo = postInfo;
        this.excerpt = excerpt;
        this.publishDate = publishDate;
        this.slug = slug;
        this.title = title;
        this.status = status;
        this.seo = seo;
        this.categoryId = categoryIdSubcategoryId.split('#')[0]; // Extract categoryId
        this.subcategoryId = categoryIdSubcategoryId.split('#')[1]; // Extract subcategoryId

    }
}



