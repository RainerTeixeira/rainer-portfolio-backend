// src/modules/blog/comments/dto/create-comment.dto.ts

import { CommentDto } from '@src/modules/blog/comments/dto/comment.dto'; // Import CommentDto usando alias @src.
import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator'; // Import decorators de validação

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

    @IsNotEmpty()
    @IsString()
    date: string;

    @IsOptional() // Status pode ser opcional ao criar, com um valor padrão no backend
    @IsString()
    status?: string;
}