"use strict";
// src/modules/blog/posts/dto/post.dto.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostDto = void 0;
class PostDto {
    constructor(categoryIdSubcategoryId, postId, categoryId, subcategoryId, contentHTML, postInfo, excerpt, publishDate, slug, title, status, seo) {
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
exports.PostDto = PostDto;
