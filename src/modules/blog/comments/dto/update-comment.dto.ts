// src/modules/blog/comments/dto/update-comment.dto.ts

import { CommentDto } from './comment.dto';
import { IsOptional, IsString, IsNumber } from 'class-validator'; // Import decorators de validação

export class UpdateCommentDto {
    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsString()
    date?: string;

    @IsOptional()
    @IsString()
    status?: string;
}