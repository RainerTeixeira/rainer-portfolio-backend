<<<<<<< HEAD
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UsePipes, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto, ListPostsDto } from './dto'; // Certifique-se de importar corretamente os DTOs

@Controller('posts')
@UsePipes(new ValidationPipe({ transform: true })) // Transforma os dados de entrada para os tipos dos DTOs.
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @Post()
    async create(@Body() createPostDto: CreatePostDto) {
        try {
            // Passa o DTO para o serviço para criar o post
            return await this.postsService.create(createPostDto);
        } catch (error) {
            // Trata os erros de forma detalhada
            if (error instanceof Error) {
                throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
            } else {
                throw new HttpException('Erro desconhecido', HttpStatus.BAD_REQUEST);
            }
        }
    }

    @Get()
    async findAll(@Query() query: any): Promise<ListPostsDto[]> {
        try {
            // Passa o parâmetro da query para o serviço para buscar todos os posts.
            return await this.postsService.findAll(query);
        } catch (error) {
            if (error instanceof Error) {
                throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
            } else {
                throw new HttpException('Erro desconhecido', HttpStatus.BAD_REQUEST);
            }
        }
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        try {
            // Busca um post específico pelo ID
            return await this.postsService.findOne(id);
        } catch (error) {
            if (error instanceof Error) {
                throw new HttpException(error.message, HttpStatus.NOT_FOUND);
            } else {
                throw new HttpException('Erro desconhecido', HttpStatus.NOT_FOUND);
            }
        }
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updatePostDto: UpdatePostDto
    ) {
        try {
            // Passa o ID e o DTO de atualização para o serviço
            return await this.postsService.update(id, updatePostDto);
        } catch (error) {
            if (error instanceof Error) {
                throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
            } else {
                throw new HttpException('Erro desconhecido', HttpStatus.BAD_REQUEST);
            }
        }
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        try {
            // Passa o ID para o serviço para remover o post
            return await this.postsService.remove(id);
        } catch (error) {
            if (error instanceof Error) {
                throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
            } else {
                throw new HttpException('Erro desconhecido', HttpStatus.BAD_REQUEST);
            }
        }
    }
}
=======
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UsePipes, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto, ListPostsDto } from './dto'; // Certifique-se de importar corretamente os DTOs

@Controller('posts')
@UsePipes(new ValidationPipe({ transform: true })) // Transforma os dados de entrada para os tipos dos DTOs
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @Post()
    async create(@Body() createPostDto: CreatePostDto) {
        try {
            // Passa o DTO para o serviço para criar o post
            return await this.postsService.create(createPostDto);
        } catch (error) {
            // Trata os erros de forma detalhada
            if (error instanceof Error) {
                throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
            } else {
                throw new HttpException('Erro desconhecido', HttpStatus.BAD_REQUEST);
            }
        }
    }

    @Get()
    async findAll(@Query() query: any): Promise<ListPostsDto[]> {
        try {
            // Passa o parâmetro da query para o serviço para buscar todos os posts
            return await this.postsService.findAll(query);
        } catch (error) {
            if (error instanceof Error) {
                throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
            } else {
                throw new HttpException('Erro desconhecido', HttpStatus.BAD_REQUEST);
            }
        }
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        try {
            // Busca um post específico pelo ID
            return await this.postsService.findOne(id);
        } catch (error) {
            if (error instanceof Error) {
                throw new HttpException(error.message, HttpStatus.NOT_FOUND);
            } else {
                throw new HttpException('Erro desconhecido', HttpStatus.NOT_FOUND);
            }
        }
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updatePostDto: UpdatePostDto
    ) {
        try {
            // Passa o ID e o DTO de atualização para o serviço
            return await this.postsService.update(id, updatePostDto);
        } catch (error) {
            if (error instanceof Error) {
                throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
            } else {
                throw new HttpException('Erro desconhecido', HttpStatus.BAD_REQUEST);
            }
        }
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        try {
            // Passa o ID para o serviço para remover o post
            return await this.postsService.remove(id);
        } catch (error) {
            if (error instanceof Error) {
                throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
            } else {
                throw new HttpException('Erro desconhecido', HttpStatus.BAD_REQUEST);
            }
        }
    }
}
>>>>>>> 5bd87ddc6102c11e5c62fb22f6f92a411637e9ed
