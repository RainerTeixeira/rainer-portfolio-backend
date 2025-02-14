"use strict";
// src/modules/blog/authors/dto/author.dto.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorDto = void 0;
class AuthorDto {
    constructor(postId, authorId, name, slug, expertise, socialProof) {
        this.postId = postId;
        this.authorId = authorId;
        this.name = name;
        this.slug = slug;
        this.expertise = expertise;
        this.socialProof = socialProof;
    }
}
exports.AuthorDto = AuthorDto;
