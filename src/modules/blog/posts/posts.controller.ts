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
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from '@src/modules/blog/posts/dto/create-post.dto';
import { UpdatePostDto } from '@src/modules/blog/posts/dto/update-post.dto';
import { ListPostsDto } from '@src/modules/blog/posts/dto/list-posts.dto';
import { PostBaseDto } from '@src/modules/blog/posts/dto/post-base.dto';
import { CognitoAuthGuard } from '@src/auth/cognito-auth.guard';
import { ValidationPipe } from '@nestjs/common/pipes';

@ApiTags('Posts')
@Controller('posts')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo post' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Post criado com sucesso',
    type: PostBaseDto
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos' })
  @UseGuards(CognitoAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPostDto: CreatePostDto): Promise<{ data: PostBaseDto }> {
    try {
      const result = await this.postsService.create(createPostDto);
      return this.formatResponse('Post criado com sucesso', result);
    } catch (error) {
      this.handleDynamoError(error, 'Erro ao criar post');
    }
  }

  @ApiOperation({ summary: 'Listar posts paginados' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite de resultados (máx 50)' })
  @ApiQuery({ name: 'lastKey', required: false, type: String, description: 'Chave para paginação' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de posts recuperada',
    type: ListPostsDto
  })
  @Get()
  async findAll(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('lastKey') lastKey?: string,
  ): Promise<ListPostsDto> {
    try {
      const safeLimit = Math.min(limit || 20, 50);
      const result = await this.postsService.findAll({
        limit: safeLimit.toString(),
        lastKey,
      });
      return this.formatPaginatedResponse(result);
    } catch (error) {
      this.handleDynamoError(error, 'Erro ao buscar posts');
    }
  }

  @ApiOperation({ summary: 'Obter post por ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post encontrado',
    type: PostBaseDto
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post não encontrado' })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<{ data: PostBaseDto }> {
    try {
      const result = await this.postsService.findOne(id);
      return this.formatResponse('Post encontrado', result);
    } catch (error) {
      this.handleDynamoError(error, 'Post não encontrado', HttpStatus.NOT_FOUND);
    }
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar post' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post atualizado',
    type: PostBaseDto
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post não encontrado' })
  @UseGuards(CognitoAuthGuard)
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<{ data: PostBaseDto }> {
    try {
      const result = await this.postsService.update(id, updatePostDto);
      return this.formatResponse('Post atualizado com sucesso', result);
    } catch (error) {
      this.handleDynamoError(error, 'Erro ao atualizar post');
    }
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir post' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Post excluído com sucesso' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post não encontrado' })
  @UseGuards(CognitoAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    try {
      await this.postsService.remove(id);
    } catch (error) {
      this.handleDynamoError(error, 'Erro ao excluir post');
    }
  }

  private handleDynamoError(
    error: unknown,
    defaultMessage: string,
    defaultStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ): never {
    const dynamoError = error as Error;

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

    const errorName = dynamoError.name as keyof typeof errorMap;
    const { status, message } = errorMap[errorName] || {
      status: defaultStatus,
      message: defaultMessage,
    };

    throw new HttpException(
      {
        statusCode: status,
        message: `${message}: ${dynamoError.message}`,
        timestamp: new Date().toISOString()
      },
      status,
    );
  }

  private formatResponse(message: string, data: PostBaseDto) {
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