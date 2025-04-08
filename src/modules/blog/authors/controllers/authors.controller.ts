import { Controller, Get, Post, Body, Put, Param, Delete, Logger, UseGuards } from '@nestjs/common'; // Importa decorators e Logger do NestJS
import { AuthorsService } from '../services/authors.service'; // Importa AuthorsService
import { CreateAuthorDto } from '../dto/create-author.dto'; // Importa DTO para criação de autor
import { UpdateAuthorDto } from '../dto/update-author.dto'; // Importa DTO para atualização de autor
import { AuthorDetailDto } from '../dto/author-detail.dto'; // Corrigir a capitalização do nome do arquivo
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CognitoAuthGuard } from '@src/auth/cognito-auth.guard';

/**
 * @Controller('blog/authors')
 * Controller responsável por gerenciar as rotas relacionadas a Autores dentro do módulo 'blog'.
 * Define os endpoints para operações CRUD (Create, Read, Update, Delete) de autores.
 * A rota base para este controller é '/blog/authors'.
 */
@ApiTags('Authors')
@Controller('blog/authors')
export class AuthorsController {
    private readonly logger = new Logger(AuthorsController.name); // Logger para registrar eventos e erros neste controller

    /**
     * Injeta a instância de AuthorsService para utilizar a lógica de negócio dos autores.
     * @param authorsService Serviço de Autores.
     */
    constructor(private readonly authorsService: AuthorsService) { }

    /**
     * Rota POST para criar um novo autor.
     * Endpoint: POST /blog/authors
     * @param createAuthorDto DTO contendo os dados para criação do autor, recebidos no corpo da requisição.
     * @returns Uma Promise que resolve para um AuthorDetailDto representando o autor criado.
     */
    @ApiOperation({ summary: 'Cria um novo autor' })
    @ApiResponse({ status: 201, description: 'Autor criado com sucesso.', type: AuthorDetailDto })
    @ApiResponse({ status: 400, description: 'Dados inválidos.' })
    @UseGuards(CognitoAuthGuard)
    @Post()
    async create(@Body() createAuthorDto: CreateAuthorDto): Promise<AuthorDetailDto> {
        this.logger.log('Endpoint POST /blog/authors acionado'); // Log de acesso ao endpoint POST
        const result = await this.authorsService.create(createAuthorDto);
        return result.data; // Extrai o campo `data` do retorno do serviço
    }

    /**
     * Rota GET para buscar todos os autores.
     * Endpoint: GET /blog/authors
     * @returns Uma Promise que resolve para um array de AuthorDetailDto, contendo todos os autores.
     */
    @ApiOperation({ summary: 'Retorna uma listagem de autores' })
    @ApiResponse({ status: 200, description: 'Lista de autores.', type: [AuthorDetailDto] })
    @ApiResponse({ status: 404, description: 'Nenhum autor encontrado.' })
    @Get()
    async findAll(): Promise<AuthorDetailDto[]> {
        this.logger.log('Endpoint GET /blog/authors acionado'); // Log de acesso ao endpoint GET (todos)
        const result = await this.authorsService.findAll();
        return result.data; // Extrai o campo `data` do retorno do serviço
    }

    /**
     * Rota GET para buscar um autor específico pelo authorId.
     * Endpoint: GET /blog/authors/:authorId
     * @param authorId ID do autor a ser buscado, extraído dos parâmetros da rota.
     * @returns Uma Promise que resolve para um AuthorDetailDto, se o autor for encontrado.
     */
    @ApiOperation({ summary: 'Retorna um autor pelo ID' })
    @ApiResponse({ status: 200, description: 'Autor encontrado.', type: AuthorDetailDto })
    @ApiResponse({ status: 404, description: 'Autor não encontrado.' })
    @Get(':authorId')
    async findOne(@Param('authorId') authorId: string): Promise<AuthorDetailDto> {
        this.logger.log(`Endpoint GET /blog/authors/${authorId} acionado`); // Log de acesso ao endpoint GET (por ID)
        return this.authorsService.findOne(authorId); // Chama o serviço para buscar um autor por ID
    }

    /**
     * Rota PUT para atualizar um autor existente pelo authorId.
     * Endpoint: PUT /blog/authors/:authorId
     * @param authorId ID do autor a ser atualizado, extraído dos parâmetros da rota.
     * @param updateAuthorDto DTO contendo os dados para atualização do autor, recebidos no corpo da requisição.
     * @returns Uma Promise que resolve para um AuthorDetailDto representando o autor atualizado.
     */
    @ApiOperation({ summary: 'Atualiza um autor existente' })
    @ApiResponse({ status: 200, description: 'Autor atualizado com sucesso.', type: AuthorDetailDto })
    @ApiResponse({ status: 404, description: 'Autor não encontrado.' })
    @UseGuards(CognitoAuthGuard)
    @Put(':authorId')
    async update(
        @Param('authorId') authorId: string,
        @Body() updateAuthorDto: UpdateAuthorDto,
    ): Promise<AuthorDetailDto> {
        this.logger.log(`Endpoint PUT /blog/authors/${authorId} acionado`); // Log de acesso ao endpoint PUT
        return this.authorsService.update(authorId, updateAuthorDto); // Chama o serviço para atualizar o autor
    }

    /**
     * Rota DELETE para remover um autor pelo authorId.
     * Endpoint: DELETE /blog/authors/:authorId
     * @param authorId ID do autor a ser removido, extraído dos parâmetros da rota.
     * @returns Uma Promise que resolve void (sem retorno), indicando sucesso na remoção.
     */
    @ApiOperation({ summary: 'Remove um autor pelo ID' })
    @ApiResponse({ status: 200, description: 'Autor removido com sucesso.' })
    @ApiResponse({ status: 404, description: 'Autor não encontrado.' })
    @UseGuards(CognitoAuthGuard)
    @Delete(':authorId')
    async remove(@Param('authorId') authorId: string): Promise<void> {
        this.logger.log(`Endpoint DELETE /blog/authors/${authorId} acionado`); // Log de acesso ao endpoint DELETE
        return this.authorsService.remove(authorId); // Chama o serviço para remover o autor
    }
}