// src/modules/blog/comments/dto/update-comment.dto.ts

import { CommentDto } from '@src/modules/blog/comments/dto/comment.dto'; // Import CommentDto usando alias @src.
import { IsOptional, IsString, IsNumber } from 'class-validator'; // Import decorators de validação
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
    @ApiProperty({ description: 'Conteúdo do comentário', required: false })
    @IsOptional()
    @IsString()
    content?: string;

    @ApiProperty({ description: 'Data do comentário', required: false })
    @IsOptional()
    @IsString()
    date?: string;

    @ApiProperty({ description: 'Status do comentário', required: false })
    @IsOptional()
    @IsString()
    status?: string;
}