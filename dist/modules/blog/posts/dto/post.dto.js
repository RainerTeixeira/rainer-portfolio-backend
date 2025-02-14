"use strict";
// src/modules/blog/posts/dto/post.dto.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostDto = exports.PostStatus = void 0;
var PostStatus;
(function (PostStatus) {
    PostStatus["DRAFT"] = "draft";
    PostStatus["PUBLISHED"] = "published";
    // ... outros status se necessário
})(PostStatus || (exports.PostStatus = PostStatus = {}));
class PostDto {
    constructor(postId, categoryIdSubcategoryId, contentHTML, postInfo, excerpt, publishDate, slug, title, status, // status: PostStatus no construtor
    seo) {
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
exports.PostDto = PostDto;
