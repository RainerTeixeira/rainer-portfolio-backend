import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentEntity } from './comment.entity';

@Controller('comments')
export class CommentController {
    constructor(private readonly commentService: CommentService) { }

    @Post()
    async create(@Body() createDto: CreateCommentDto): Promise<CommentEntity> {
        return await this.commentService.create(createDto);
    }

    @Get(':postId/:timestamp')
    async findById(@Param('postId') postId: string, @Param('timestamp') timestamp: string): Promise<CommentEntity> {
        return await this.commentService.findById(postId, timestamp);
    }

    @Put(':postId/:timestamp')
    async update(
        @Param('postId') postId: string,
        @Param('timestamp') timestamp: string,
        @Body() updateDto: UpdateCommentDto,
    ): Promise<CommentEntity> {
        return await this.commentService.update(postId, timestamp, updateDto);
    }

    @Delete(':postId/:timestamp')
    async delete(@Param('postId') postId: string, @Param('timestamp') timestamp: string): Promise<void> {
        return await this.commentService.delete(postId, timestamp);
    }

    @Get('post/:postId')
    async findCommentsByPost(@Param('postId') postId: string): Promise<CommentEntity[]> {
        return await this.commentService.findCommentsByPost(postId);
    }

    @Get('user/:userId')
    async findCommentsByUser(@Param('userId') userId: string): Promise<CommentEntity[]> {
        return await this.commentService.findCommentsByUser(userId);
    }
}
