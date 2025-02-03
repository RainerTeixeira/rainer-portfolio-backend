// src/controller/blog/posts/posts.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UsePipes, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto } from './dto'; // Correto, importa do index.ts

@Controller('posts')
@UsePipes(new ValidationPipe({ transform: true }))
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @Post()
    async create(@Body() createPostDto: CreatePostDto) {
        try {
            return await this.postsService.create(createPostDto);
        } catch (error) {
            if (error instanceof Error) {
                throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
            } else {
                throw new HttpException('Erro desconhecido', HttpStatus.BAD_REQUEST);
            }
        }
    }

    @Get()
    async findAll(@Query() query: any) {
        try {
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
