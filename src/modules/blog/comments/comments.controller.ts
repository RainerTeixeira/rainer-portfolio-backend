import { Controller, Get, Post, Body, Put, Param, Delete, ValidationPipe } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentDto } from './dto/comment.dto';

@Controller('blog/comments') // Rota base para comments
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @Post()
    async create(@Body(new ValidationPipe()) createCommentDto: CreateCommentDto): Promise<CommentDto> {
        return this.commentsService.create(createCommentDto);
    }

    @Get()
    async findAll(): Promise<CommentDto[]> {
        return this.commentsService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<CommentDto> {
        return this.commentsService.findOne(+id);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body(new ValidationPipe()) updateCommentDto: UpdateCommentDto,
    ): Promise<CommentDto> {
        return this.commentsService.update(+id, updateCommentDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        return this.commentsService.remove(+id);
    }
}