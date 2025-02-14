"use strict";
// src/modules/blog/comments/dto/comment.dto.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentDto = void 0;
class CommentDto {
    constructor(postId, authorId, content, date, status) {
        this.postId = postId;
        this.authorId = authorId;
        this.content = content;
        this.date = date;
        this.status = status;
    }
}
exports.CommentDto = CommentDto;
