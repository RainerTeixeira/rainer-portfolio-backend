// src/modules/blog/comments/dto/create-comment.dto.ts

import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
    @ApiProperty({ description: 'ID do post' })
    @IsNotEmpty()
    @IsString()
    postId: string;

    @ApiProperty({ description: 'ID do autor' })
    @IsNotEmpty()
    @IsString()
    authorId: string;

    @ApiProperty({ description: 'Conteúdo do comentário' })
    @IsNotEmpty()
    @IsString()
    content: string;

    @ApiProperty({ description: 'Data do comentário', required: false })
    @IsOptional()
    @IsString()
    date?: string;

    constructor(postId: string, authorId: string, content: string, date?: string) {
        this.postId = postId;
        this.authorId = authorId;
        this.content = content;
        this.date = date;
    }
}