"use strict";
// src/modules/blog/posts/dto/post.dto.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostDto = void 0;
class PostDto {
    constructor(postId, categoryIdSubcategoryId, contentHTML, postInfo, excerpt, publishDate, slug, title, // title moved before status
    status, // status moved before seo
    seo) {
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
exports.PostDto = PostDto;
