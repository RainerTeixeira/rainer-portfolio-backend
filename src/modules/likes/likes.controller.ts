import { Controller, Get, Post, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { LikesService } from './likes.service.js';
import type { CreateLikeData } from './like.model.js';

@ApiTags('❤️ Likes')
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '❤️ Curtir Post' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        postId: { type: 'string', example: '507f1f77bcf86cd799439022' },
      },
      required: ['userId', 'postId'],
    },
  })
  async like(@Body() data: CreateLikeData) {
    const like = await this.likesService.likePost(data);
    return { success: true, data: like };
  }

  @Delete(':userId/:postId')
  @ApiOperation({ summary: '💔 Descurtir Post' })
  @ApiParam({ name: 'userId' })
  @ApiParam({ name: 'postId' })
  async unlike(@Param('userId') userId: string, @Param('postId') postId: string) {
    return await this.likesService.unlikePost(userId, postId);
  }

  @Get('post/:postId')
  @ApiOperation({ summary: '📊 Likes do Post' })
  @ApiParam({ name: 'postId' })
  async getByPost(@Param('postId') postId: string) {
    const likes = await this.likesService.getLikesByPost(postId);
    return { success: true, data: likes };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: '👤 Likes do Usuário' })
  @ApiParam({ name: 'userId' })
  async getByUser(@Param('userId') userId: string) {
    const likes = await this.likesService.getLikesByUser(userId);
    return { success: true, data: likes };
  }

  @Get('post/:postId/count')
  @ApiOperation({ summary: '🔢 Contar Likes' })
  @ApiParam({ name: 'postId' })
  async count(@Param('postId') postId: string) {
    return await this.likesService.getLikesCount(postId);
  }

  @Get(':userId/:postId/check')
  @ApiOperation({ summary: '✅ Verificar Like' })
  @ApiParam({ name: 'userId' })
  @ApiParam({ name: 'postId' })
  async check(@Param('userId') userId: string, @Param('postId') postId: string) {
    return await this.likesService.hasUserLiked(userId, postId);
  }
}

