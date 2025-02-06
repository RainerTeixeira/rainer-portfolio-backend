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
  ValidationPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto, ListPostsDto } from './dto'; // Certifique-se de importar corretamente os DTOs

@Controller('posts')
@UsePipes(new ValidationPipe({ transform: true })) // Transforma os dados de entrada para os tipos dos DTOs
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @Post()
  async create(@Body() createPostDto: CreatePostDto) {
    try {
      return await this.postsService.create(createPostDto);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Erro desconhecido',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async findAll(@Query() query: any): Promise<ListPostsDto[]> {
    try {
      return await this.postsService.findAll(query);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Erro desconhecido',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.postsService.findOne(id);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Erro desconhecido',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    try {
      return await this.postsService.update(id, updatePostDto);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Erro desconhecido',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.postsService.remove(id);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Erro desconhecido',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}