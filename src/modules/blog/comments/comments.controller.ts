import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CommentService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentEntity } from './comments.entity'; // Nome correto da entidade

@ApiTags('comments')
@Controller('comments')
export class CommentController {
    constructor(private readonly commentService: CommentService) { }

    @Post()
    @ApiOperation({ summary: 'Cria um novo comentário' })
    @ApiBody({ type: CreateCommentDto, description: 'Dados para criar um comentário' })
    @ApiResponse({ status: 201, description: 'Comentário criado com sucesso', type: CommentEntity })
    async create(@Body() createDto: CreateCommentDto): Promise<CommentEntity> {
        return await this.commentService.create(createDto);
    }

    @Get(':postId/:timestamp')
    @ApiOperation({ summary: 'Busca um comentário específico pelo postId e timestamp' })
    @ApiParam({ name: 'postId', description: 'ID do post relacionado ao comentário' })
    @ApiParam({ name: 'timestamp', description: 'Timestamp do comentário' })
    @ApiResponse({ status: 200, description: 'Comentário encontrado', type: CommentEntity })
    async findById(@Param('postId') postId: string, @Param('timestamp') timestamp: string): Promise<CommentEntity> {
        return await this.commentService.findById(postId, timestamp);
    }

    @Put(':postId/:timestamp')
    @ApiOperation({ summary: 'Atualiza um comentário específico pelo postId e timestamp' })
    @ApiParam({ name: 'postId', description: 'ID do post relacionado ao comentário' })
    @ApiParam({ name: 'timestamp', description: 'Timestamp do comentário' })
    @ApiBody({ type: UpdateCommentDto, description: 'Dados para atualizar o comentário' })
    @ApiResponse({ status: 200, description: 'Comentário atualizado com sucesso', type: CommentEntity })
    async update(
        @Param('postId') postId: string,
        @Param('timestamp') timestamp: string,
        @Body() updateDto: UpdateCommentDto,
    ): Promise<CommentEntity> {
        return await this.commentService.update(postId, timestamp, updateDto);
    }

    @Delete(':postId/:timestamp')
    @ApiOperation({ summary: 'Deleta um comentário específico pelo postId e timestamp' })
    @ApiParam({ name: 'postId', description: 'ID do post relacionado ao comentário' })
    @ApiParam({ name: 'timestamp', description: 'Timestamp do comentário' })
    @ApiResponse({ status: 204, description: 'Comentário deletado com sucesso' })
    async delete(@Param('postId') postId: string, @Param('timestamp') timestamp: string): Promise<void> {
        return await this.commentService.delete(postId, timestamp);
    }

    @Get('post/:postId')
    @ApiOperation({ summary: 'Busca todos os comentários de um post específico' })
    @ApiParam({ name: 'postId', description: 'ID do post para buscar os comentários' })
    @ApiResponse({ status: 200, description: 'Lista de comentários do post', type: [CommentEntity] })
    async findCommentsByPost(@Param('postId') postId: string): Promise<CommentEntity[]> {
        return await this.commentService.findCommentsByPost(postId);
    }

    @Get('user/:userId')
    @ApiOperation({ summary: 'Busca todos os comentários de um usuário específico' })
    @ApiParam({ name: 'userId', description: 'ID do usuário para buscar os comentários' })
    @ApiResponse({ status: 200, description: 'Lista de comentários do usuário', type: [CommentEntity] })
    async findCommentsByUser(@Param('userId') userId: string): Promise<CommentEntity[]> {
        return await this.commentService.findCommentsByUser(userId);
    }
}