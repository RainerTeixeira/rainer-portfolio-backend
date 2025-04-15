/**
 * Controller responsável pelo gerenciamento dos endpoints de autores no módulo de blog.
 * Expõe operações REST para criação, listagem, consulta, atualização e remoção de autores.
 * Utiliza o serviço AuthorsService para executar as regras de negócio.
 *
 * Endpoints:
 * - POST /authors: Criação de novo autor.
 * - GET /authors: Listagem de todos os autores.
 * - GET /authors/:id: Consulta de detalhes de um autor específico.
 * - PUT /authors/:id: Atualização de dados de um autor.
 * - DELETE /authors/:id: Remoção de um autor.
 *
 * Todos os endpoints estão documentados via Swagger.
 *
 * @author
 * @module AuthorsController
 */

import { Controller, Get, Post, Body, Param, Put, Delete, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthorsService } from '@src/modules/blog/authors/authors.service';
import { CreateAuthorDto } from '@src/modules/blog/authors/dto/create-author.dto';
import { UpdateAuthorDto } from '@src/modules/blog/authors/dto/update-author.dto';
import { AuthorEntity } from '@src/modules/blog/authors/authors.entity';
@ApiTags('Authors Management')
@Controller('authors')
export class AuthorsController {
    /**
     * Injeta o serviço de autores.
     * @param service Serviço responsável pelas regras de negócio de autores.
     */
    constructor(private readonly service: AuthorsService) { }

    /**
     * Cria um novo autor.
     * @param dto Dados para criação do autor.
     * @returns Autor criado.
     */
    @Post()
    @ApiOperation({ summary: 'Create new author' })
    @ApiResponse({ status: 201, type: AuthorEntity })
    async create(@Body() dto: CreateAuthorDto): Promise<AuthorEntity> {
        return this.service.create(dto);
    }

    /**
     * Lista todos os autores cadastrados.
     * @returns Lista de autores.
     */
    @Get()
    @ApiOperation({ summary: 'List all authors' })
    @ApiResponse({ status: 200, type: [AuthorEntity] })
    async findAll(): Promise<AuthorEntity[]> {
        return this.service.findAll();
    }

    /**
     * Consulta os detalhes de um autor específico pelo ID.
     * @param id Identificador do autor.
     * @returns Autor encontrado.
     */
    @Get(':id')
    @ApiOperation({ summary: 'Get author details' })
    @ApiResponse({ status: 200, type: AuthorEntity })
    async findOne(@Param('id') id: string): Promise<AuthorEntity> {
        return this.service.findOne(id);
    }

    /**
     * Atualiza os dados de um autor existente.
     * @param id Identificador do autor.
     * @param dto Dados para atualização.
     * @returns Autor atualizado.
     */
    @Put(':id')
    @ApiOperation({ summary: 'Update author' })
    @ApiResponse({ status: 200, type: AuthorEntity })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateAuthorDto
    ): Promise<AuthorEntity> {
        return this.service.update(id, dto);
    }

    /**
     * Remove um autor pelo ID.
     * @param id Identificador do autor.
     */
    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete author' })
    @ApiResponse({ status: 204 })
    async delete(@Param('id') id: string): Promise<void> {
        return this.service.delete(id);
    }
}