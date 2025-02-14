"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorDto = void 0;
class AuthorDto {
    constructor(postId, authorId, expertise, name, slug, socialProof) {
        this.postId = postId;
        this.authorId = authorId;
        this.expertise = expertise;
        this.name = name;
        this.slug = slug;
        this.socialProof = socialProof;
    }
}
exports.AuthorDto = AuthorDto;
