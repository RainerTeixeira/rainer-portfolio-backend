import { Controller, Get, Post, Body, Put, Param, Delete, Logger } from '@nestjs/common'; // Importa decorators e Logger do NestJS
import { AuthorsService } from '../services/authors.service'; // Importa AuthorsService
import { CreateAuthorDto } from '../dto/create-author.dto'; // Importa DTO para criação de autor
import { UpdateAuthorDto } from '../dto/update-author.dto'; // Importa DTO para atualização de autor
import { AuthorDto } from '../dto/author.dto'; // Importa DTO para representação de autor

/**
 * @Controller('blog/authors')
 * Controller responsável por gerenciar as rotas relacionadas a Autores dentro do módulo 'blog'.
 * Define os endpoints para operações CRUD (Create, Read, Update, Delete) de autores.
 * A rota base para este controller é '/blog/authors'.
 */
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
     * @returns Uma Promise que resolve para um AuthorDto representando o autor criado.
     */
    @Post()
    async create(@Body() createAuthorDto: CreateAuthorDto): Promise<AuthorDto> {
        this.logger.log('Endpoint POST /blog/authors acionado'); // Log de acesso ao endpoint POST
        return this.authorsService.create(createAuthorDto); // Chama o serviço para criar o autor
    }

    /**
     * Rota GET para buscar todos os autores.
     * Endpoint: GET /blog/authors
     * @returns Uma Promise que resolve para um array de AuthorDto, contendo todos os autores.
     */
    @Get()
    async findAll(): Promise<AuthorDto[]> {
        this.logger.log('Endpoint GET /blog/authors acionado'); // Log de acesso ao endpoint GET (todos)
        return this.authorsService.findAll(); // Chama o serviço para buscar todos os autores
    }

    /**
     * Rota GET para buscar um autor específico pelo authorId.
     * Endpoint: GET /blog/authors/:authorId
     * @param authorId ID do autor a ser buscado, extraído dos parâmetros da rota.
     * @returns Uma Promise que resolve para um AuthorDto, se o autor for encontrado.
     */
    @Get(':authorId')
    async findOne(@Param('authorId') authorId: string): Promise<AuthorDto> {
        this.logger.log(`Endpoint GET /blog/authors/${authorId} acionado`); // Log de acesso ao endpoint GET (por ID)
        return this.authorsService.findOne(authorId); // Chama o serviço para buscar um autor por ID
    }

    /**
     * Rota PUT para atualizar um autor existente pelo authorId.
     * Endpoint: PUT /blog/authors/:authorId
     * @param authorId ID do autor a ser atualizado, extraído dos parâmetros da rota.
     * @param updateAuthorDto DTO contendo os dados para atualização do autor, recebidos no corpo da requisição.
     * @returns Uma Promise que resolve para um AuthorDto representando o autor atualizado.
     */
    @Put(':authorId')
    async update(
        @Param('authorId') authorId: string,
        @Body() updateAuthorDto: UpdateAuthorDto,
    ): Promise<AuthorDto> {
        this.logger.log(`Endpoint PUT /blog/authors/${authorId} acionado`); // Log de acesso ao endpoint PUT
        return this.authorsService.update(authorId, updateAuthorDto); // Chama o serviço para atualizar o autor
    }

    /**
     * Rota DELETE para remover um autor pelo authorId.
     * Endpoint: DELETE /blog/authors/:authorId
     * @param authorId ID do autor a ser removido, extraído dos parâmetros da rota.
     * @returns Uma Promise que resolve void (sem retorno), indicando sucesso na remoção.
     */
    @Delete(':authorId')
    async remove(@Param('authorId') authorId: string): Promise<void> {
        this.logger.log(`Endpoint DELETE /blog/authors/${authorId} acionado`); // Log de acesso ao endpoint DELETE
        return this.authorsService.remove(authorId); // Chama o serviço para remover o autor
    }
}