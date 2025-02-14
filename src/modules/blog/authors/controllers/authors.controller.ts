// src/modules/blog/authors/controllers/authors.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common'; // Importa decorators do NestJS para controllers.
import { AuthorsService } from '@src/modules/blog/authors/services/authors.service'; // Importa AuthorsService usando alias @src.
import { CreateAuthorDto } from '@src/modules/blog/authors/dto/create-author.dto'; // Importa CreateAuthorDto usando alias @src.
import { UpdateAuthorDto } from '@src/modules/blog/authors/dto/update-author.dto'; // Importa UpdateAuthorDto usando alias @src.
import { AuthorDto } from '@src/modules/blog/authors/dto/author.dto'; // Importa AuthorDto usando alias @src.

@Controller('blog/authors') // Define o endpoint base para este controller
export class AuthorsController {
    constructor(private readonly authorsService: AuthorsService) { } // Injeta AuthorsService

    @Post() // POST /blog/authors
    async create(@Body() createAuthorDto: CreateAuthorDto): Promise<AuthorDto> {
        return this.authorsService.create(createAuthorDto);
    }

    @Get() // GET /blog/authors
    async findAll(): Promise<AuthorDto[]> {
        return this.authorsService.findAll();
    }

    @Get(':postId/:authorId') // GET /blog/authors/:postId/:authorId
    async findOne(
        @Param('postId') postId: string,
        @Param('authorId') authorId: string,
    ): Promise<AuthorDto> {
        return this.authorsService.findOne(postId, authorId);
    }

    @Put(':postId/:authorId') // PUT /blog/authors/:postId/:authorId
    async update(
        @Param('postId') postId: string,
        @Param('authorId') authorId: string,
        @Body() updateAuthorDto: UpdateAuthorDto,
    ): Promise<AuthorDto> {
        return this.authorsService.update(postId, authorId, updateAuthorDto);
    }

    @Delete(':postId/:authorId') // DELETE /blog/authors/:postId/:authorId
    async remove(
        @Param('postId') postId: string,
        @Param('authorId') authorId: string,
    ): Promise<void> {
        return this.authorsService.remove(postId, authorId);
    }
}