import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CommentsService } from '@src/modules/blog/comments/services/comments.service';
import { CreateCommentDto } from '@src/modules/blog/comments/dto/create-comment.dto';
import { UpdateCommentDto } from '@src/modules/blog/comments/dto/update-comment.dto';
import { CommentDto } from '@src/modules/blog/comments/dto/comment.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('comments')
@Controller('blog/comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @ApiOperation({ summary: 'Cria um novo comentário' })
    @ApiResponse({ status: 201, description: 'Comentário criado com sucesso.', type: CommentDto })
    @Post()
    async create(@Body() createCommentDto: CreateCommentDto): Promise<CommentDto> {
        const result = await this.commentsService.create(createCommentDto);
        return result.data; // Extrai o campo `data` do retorno do serviço
    }

    @ApiOperation({ summary: 'Obtém todos os comentários' })
    @ApiResponse({ status: 200, description: 'Lista de comentários.', type: [CommentDto] })
    @Get()
    async findAll(): Promise<CommentDto[]> {
        const result = await this.commentsService.findAll();
        return result.data; // Extrai o campo `data` do retorno do serviço
    }

    @ApiOperation({ summary: 'Obtém um comentário pelo postId e authorId' })
    @ApiResponse({ status: 200, description: 'Comentário encontrado.', type: CommentDto })
    @ApiResponse({ status: 404, description: 'Comentário não encontrado.' })
    @Get(':postId/:authorId')
    async findOne(
        @Param('postId') postId: string,
        @Param('authorId') authorId: string,
    ): Promise<CommentDto> {
        return this.commentsService.findOne(postId, authorId);
    }

    @ApiOperation({ summary: 'Obtém comentários pelo status e data' })
    @ApiResponse({ status: 200, description: 'Comentários encontrados.', type: [CommentDto] })
    @Get('status/:status')
    async findByStatusAndDate(
        @Param('status') status: string,
        @Query('date') date?: string,
    ): Promise<CommentDto[]> {
        return this.commentsService.getCommentsByStatusAndDate(status, date);
    }

    @ApiOperation({ summary: 'Atualiza um comentário' })
    @ApiResponse({ status: 200, description: 'Comentário atualizado com sucesso.', type: CommentDto })
    @ApiResponse({ status: 404, description: 'Comentário não encontrado.' })
    @Put(':postId/:authorId')
    async update(
        @Param('postId') postId: string,
        @Param('authorId') authorId: string,
        @Body() updateCommentDto: UpdateCommentDto,
    ): Promise<CommentDto> {
        return this.commentsService.update(postId, authorId, updateCommentDto);
    }

    @ApiOperation({ summary: 'Remove um comentário' })
    @ApiResponse({ status: 200, description: 'Comentário removido com sucesso.' })
    @ApiResponse({ status: 404, description: 'Comentário não encontrado.' })
    @Delete(':postId/:authorId')
    async remove(
        @Param('postId') postId: string,
        @Param('authorId') authorId: string,
    ): Promise<void> {
        return this.commentsService.remove(postId, authorId);
    }
}