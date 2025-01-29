// src/controller/authors/authors.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

@Controller('authors')
export class AuthorsController {
    constructor(private readonly authorsService: AuthorsService) { }

    @Post()
    async create(@Body() createAuthorDto: CreateAuthorDto) {
        return this.authorsService.create(createAuthorDto);
    }

    @Get()
    async findAll() {
        return this.authorsService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.authorsService.findOne(id);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateAuthorDto: UpdateAuthorDto,
    ) {
        return this.authorsService.update(id, updateAuthorDto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.authorsService.delete(id);
    }
}
