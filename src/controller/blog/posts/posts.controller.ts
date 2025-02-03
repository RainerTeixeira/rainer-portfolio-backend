import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PostsService } from './posts.service'; // Importando o serviço de posts
import { CreatePostDto, UpdatePostDto } from './dto'; // Importando os DTOs de criação e atualização de posts

@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @Post()
    async createPost(@Body() body: any) {
        return this.postsService.create(body); // A lógica de criação deve passar o corpo diretamente
    }

    @Get(':id')
    async getPost(@Param('id') id: string) {
        return this.postsService.findOne(id); // Lógica de busca do post
    }

    @Put(':id')
    async updatePost(@Param('id') id: string, @Body() body: any) {
        return this.postsService.update(id, body); // Atualizando post
    }

    @Delete(':id')
    async deletePost(@Param('id') id: string) {
        return this.postsService.remove(id); // Remover post
    }

    @Get()
    async getAllPosts(@Query() query: any) {
        return this.postsService.getAll(query); // Lógica de pegar todos os posts
    }
}
