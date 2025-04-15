import { Controller, Get, Post, Body, Param, Put, Delete, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthorsService } from '../services/authors.service';
import { CreateAuthorDto } from '../dto/create-author.dto';
import { UpdateAuthorDto } from '../dto/update-author.dto';
import { AuthorEntity } from '../entities/author.entity';

@ApiTags('Authors Management')
@Controller('authors')
export class AuthorsController {
    constructor(private readonly service: AuthorsService) { }

    @Post()
    @ApiOperation({ summary: 'Create new author' })
    @ApiResponse({ status: 201, type: AuthorEntity })
    async create(@Body() dto: CreateAuthorDto): Promise<AuthorEntity> {
        return this.service.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'List all authors' })
    @ApiResponse({ status: 200, type: [AuthorEntity] })
    async findAll(): Promise<AuthorEntity[]> {
        return this.service.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get author details' })
    @ApiResponse({ status: 200, type: AuthorEntity })
    async findOne(@Param('id') id: string): Promise<AuthorEntity> {
        return this.service.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update author' })
    @ApiResponse({ status: 200, type: AuthorEntity })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateAuthorDto
    ): Promise<AuthorEntity> {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete author' })
    @ApiResponse({ status: 204 })
    async delete(@Param('id') id: string): Promise<void> {
        return this.service.delete(id);
    }
}