// src/modules/blog/comments/dto/create-comment.dto.ts

import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateCommentDto {
    @IsNotEmpty()
    @IsNumber()
    postId: number;

    @IsNotEmpty()
    @IsString()
    authorId: string;

    @IsNotEmpty()
    @IsString()
    content: string;

    @IsOptional()
    @IsString()
    date?: string;

    constructor(postId: number, authorId: string, content: string, date?: string) {
        this.postId = postId;
        this.authorId = authorId;
        this.content = content;
        this.date = date;
    }
}