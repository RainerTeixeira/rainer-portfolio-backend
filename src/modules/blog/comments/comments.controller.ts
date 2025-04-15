import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    UseGuards,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CommentEntity } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CognitoAuthGuard } from '@src/auth/cognito-auth.guard';
import { PaginationDto } from '@src/common/dto/pagination.dto';

@ApiTags('Blog - Comments')
@ApiBearerAuth()
@Controller('comments')
export class CommentsController {
    constructor(private readonly service: CommentsService) { }

    @Post()
    @UseGuards(CognitoAuthGuard)
    @ApiOperation({ summary: 'Cria novo comentário' })
    @ApiResponse({ status: 201, type: CommentEntity })
    async create(@Body() dto: CreateCommentDto): Promise<CommentEntity> {
        return this.service.create(dto);
    }

    @Get('post/:postId')
    @ApiOperation({ summary: 'Lista comentários por post' })
    @ApiResponse({ status: 200, type: [CommentEntity] })
    async findByPost(
        @Param('postId') postId: string,
        @Query() pagination: PaginationDto
    ): Promise<CommentEntity[]> {
        return this.service.findByPost(postId, pagination);
    }

    @Get('user/:userId')
    @ApiOperation({ summary: 'Lista comentários por usuário' })
    @ApiResponse({ status: 200, type: [CommentEntity] })
    async findByUser(
        @Param('userId') userId: string,
        @Query() pagination: PaginationDto
    ): Promise<CommentEntity[]> {
        return this.service.findByUser(userId, pagination);
    }

    @Put(':id')
    @UseGuards(CognitoAuthGuard)
    @ApiOperation({ summary: 'Atualiza comentário' })
    @ApiResponse({ status: 200, type: CommentEntity })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateCommentDto
    ): Promise<CommentEntity> {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(CognitoAuthGuard)
    @ApiOperation({ summary: 'Remove comentário' })
    @ApiResponse({ status: 204 })
    async delete(@Param('id') id: string): Promise<void> {
        return this.service.delete(id);
    }
}