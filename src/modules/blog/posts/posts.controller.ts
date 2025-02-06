// src/modules/blog/posts/posts.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UsePipes,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import {
  CreatePostDto,
  UpdatePostDto,
  ListPostsDto,
} from './dto';
import { CognitoAuthGuard } from '@src/auth/cognito-auth.guard';
import { ValidationPipe } from '@nestjs/common/pipes';
import { DynamoDbError } from '@src/services/dynamoDb.service';

@Controller('posts')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @UseGuards(CognitoAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPostDto: CreatePostDto) {
    try {
      const result = await this.postsService.create(createPostDto);
      return this.formatResponse('Post criado com sucesso', result);
    } catch (error) {
      this.handleDynamoError(error, 'Erro ao criar post');
    }
  }

  @Get()
  async findAll(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('lastKey') lastKey?: string,
  ): Promise<ListPostsDto> {
    try {
      const safeLimit = Math.min(limit || 20, 50); // Max 50 items para free tier
      const result = await this.postsService.findAll({
        limit: safeLimit,
        lastKey,
      });
      return this.formatPaginatedResponse(result);
    } catch (error) {
      this.handleDynamoError(error, 'Erro ao buscar posts');
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.postsService.findOne(id);
      return this.formatResponse('Post encontrado', result);
    } catch (error) {
      this.handleDynamoError(
        error,
        'Post não encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @UseGuards(CognitoAuthGuard)
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    try {
      const result = await this.postsService.update(id, updatePostDto);
      return this.formatResponse('Post atualizado com sucesso', result);
    } catch (error) {
      this.handleDynamoError(error, 'Erro ao atualizar post');
    }
  }

  @UseGuards(CognitoAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    try {
      await this.postsService.remove(id);
    } catch (error) {
      this.handleDynamoError(error, 'Erro ao excluir post');
    }
  }

  private handleDynamoError(
    error: Error,
    defaultMessage: string,
    defaultStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ): never {
    const dynamoError = error as DynamoDbError;

    const errorMap = {
      ResourceNotFoundException: {
        status: HttpStatus.NOT_FOUND,
        message: 'Recurso não encontrado',
      },
      ProvisionedThroughputExceededException: {
        status: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Limite de requisições excedido',
      },
      ConditionalCheckFailedException: {
        status: HttpStatus.CONFLICT,
        message: 'Conflito na versão do recurso',
      },
    };

    const { status, message } = errorMap[dynamoError.name] || {
      status: defaultStatus,
      message: defaultMessage,
    };

    throw new HttpException(
      { statusCode: status, message: message, error: dynamoError.message },
      status,
    );
  }

  private formatResponse(message: string, data: any) {
    return {
      statusCode: HttpStatus.OK,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private formatPaginatedResponse(result: ListPostsDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Posts recuperados com sucesso',
      data: result.data,
      meta: {
        ...result.meta,
        timestamp: new Date().toISOString(),
      },
    };
  }
}