// src/modules/blog/authors/controllers/authors.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { AuthorsService } from '../services/authors.service';
import { CreateAuthorDto } from '../dto/create-author.dto';
import { UpdateAuthorDto } from '../dto/update-author.dto';
import { AuthorDto } from '../dto/author.dto';

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