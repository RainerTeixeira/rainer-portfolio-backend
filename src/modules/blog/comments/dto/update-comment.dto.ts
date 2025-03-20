// src/modules/blog/comments/dto/update-comment.dto.ts

import { IsOptional, IsString } from 'class-validator'; // Removido CommentDto e IsNumber
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