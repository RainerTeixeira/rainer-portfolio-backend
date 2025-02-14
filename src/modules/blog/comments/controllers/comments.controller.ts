// src/modules/blog/comments/controllers/comments.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common'; // Importa decorators do NestJS para controllers.
import { CommentsService } from '@src/modules/blog/comments/services/comments.service'; // Importa CommentsService usando alias @src.
import { CreateCommentDto } from '@src/modules/blog/comments/dto/create-comment.dto'; // Importa CreateCommentDto usando alias @src.
import { UpdateCommentDto } from '@src/modules/blog/comments/dto/update-comment.dto'; // Importa UpdateCommentDto usando alias @src.
import { CommentDto } from '@src/modules/blog/comments/dto/comment.dto'; // Importa CommentDto usando alias @src.

@Controller('blog/comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @Post()
    async create(@Body() createCommentDto: CreateCommentDto): Promise<CommentDto> {
        return this.commentsService.create(createCommentDto);
    }

    @Get()
    async findAll(): Promise<CommentDto[]> {
        return this.commentsService.findAll();
    }

    @Get(':postId/:authorId')
    async findOne(
        @Param('postId') postId: string,
        @Param('authorId') authorId: string,
    ): Promise<CommentDto> {
        return this.commentsService.findOne(postId, authorId);
    }

    @Put(':postId/:authorId')
    async update(
        @Param('postId') postId: string,
        @Param('authorId') authorId: string,
        @Body() updateCommentDto: UpdateCommentDto,
    ): Promise<CommentDto> {
        return this.commentsService.update(postId, authorId, updateCommentDto);
    }

    @Delete(':postId/:authorId')
    async remove(
        @Param('postId') postId: string,
        @Param('authorId') authorId: string,
    ): Promise<void> {
        return this.commentsService.remove(postId, authorId);
    }
}