import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthorsService } from '../services/authors.service';

import { CreateAuthorDto } from '../dto/create-author.dto'; // Importa DTO para criação de autor
import { UpdateAuthorDto } from '../dto/update-author.dto'; // Importa DTO para atualização de autor
import { AuthorDetailDto } from '../dto/author-detail.dto'; // Importa AuthorDetailDto

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CognitoAuthGuard } from '@src/auth/cognito-auth.guard';

@ApiTags('Autores')
@Controller('blog/authors')
export class AuthorsController {
    constructor(private readonly authorsService: AuthorsService) { }

    /**
     * Cria um novo autor na tabela Authors
     * @param dto Dados do autor conforme schema DynamoDB
     * @example {
     *   "authorId": "123",
     *   "name": "Nome do Autor",
     *   "slug": "slug-autor",
     *   "socialProof": {
     *     "twitter": "https://twitter.com/autor"
     *   }
     * }
     */
    @Post()
    @UseGuards(CognitoAuthGuard)
    @ApiOperation({ summary: 'Cria novo autor' })
    @ApiResponse({
        status: 201,
        description: 'Autor criado com sucesso na tabela Authors',
        type: AuthorDetailDto
    })
    async create(@Body() dto: CreateAuthorDto): Promise<AuthorDetailDto> {
        return this.authorsService.create(dto);
    }

    /**
     * Lista todos os autores usando operação SCAN na tabela Authors
     * @returns Array de autores formatados conforme AuthorDetailDto
     */
    @Get()
    @ApiOperation({ summary: 'Lista todos autores' })
    @ApiResponse({
        status: 200,
        description: 'Listagem completa de autores',
        type: [AuthorDetailDto]
    })
    async findAll(): Promise<AuthorDetailDto[]> {
        return this.authorsService.findAll();
    }

    /**
     * Busca autor específico usando authorId como chave de partição
     * @param authorId Chave primária da tabela Authors (string)
     * @example GET /blog/authors/123
     */
    @Get(':authorId')
    @ApiOperation({ summary: 'Busca autor por ID' })
    @ApiResponse({
        status: 200,
        description: 'Detalhes completos do autor',
        type: AuthorDetailDto
    })
    async findOne(@Param('authorId') authorId: string): Promise<AuthorDetailDto> {
        return this.authorsService.findOne(authorId);
    }

    /**
     * Atualiza parcialmente um autor existente
     * @param authorId Chave primária para localização do registro
     * @param dto Campos atualizados conforme schema DynamoDB
     */
    @Put(':authorId')
    @UseGuards(CognitoAuthGuard)
    @ApiOperation({ summary: 'Atualiza autor existente' })
    @ApiResponse({
        status: 200,
        description: 'Autor atualizado com sucesso',
        type: AuthorDetailDto
    })
    async update(
        @Param('authorId') authorId: string,
        @Body() dto: UpdateAuthorDto,
    ): Promise<AuthorDetailDto> {
        return this.authorsService.update(authorId, dto);
    }

    /**
     * Remove autor usando operação DELETE com chave primária
     * @param authorId Chave de partição para exclusão
     * @example DELETE /blog/authors/123
     */
    @Delete(':authorId')
    @UseGuards(CognitoAuthGuard)
    @ApiOperation({ summary: 'Remove autor' })
    @ApiResponse({
        status: 204,
        description: 'Autor removido com sucesso'
    })
    async remove(@Param('authorId') authorId: string): Promise<void> {
        return this.authorsService.remove(authorId);
    }
}