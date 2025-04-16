import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
    ApiOperation,
    ApiTags,
    ApiResponse,
    ApiBody,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { AuthorEntity } from './authors.entity';
import { AuthorService } from './authors.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

/**
 * @AuthorsController
 *
 * Controller responsável por receber as requisições HTTP e interagir com o serviço de autores.
 * Utiliza o Swagger para documentação da API e o CacheInterceptor para otimizar o desempenho.
 */
@ApiTags('Authors')
@Controller('authors')
@UseInterceptors(CacheInterceptor)
export class AuthorsController {
    constructor(private readonly authorService: AuthorService) { }

    /**
     * Endpoint para criar um novo autor.
     * @param createAuthorDto - Dados do autor a ser criado (DTO).
     * @returns Uma Promise que resolve para a entidade AuthorEntity recém-criada.
     */
    @Post()
    @ApiOperation({ summary: 'Cria um novo autor' })
    @ApiBody({ type: CreateAuthorDto })
    @ApiResponse({ status: 201, description: 'Autor criado', type: AuthorEntity })
    async create(@Body() createAuthorDto: CreateAuthorDto): Promise<AuthorEntity> {
        return this.authorService.create(createAuthorDto);
    }

    /**
     * Endpoint para atualizar um autor existente.
     * @param id - ID do autor a ser atualizado (parâmetro da rota).
     * @param updateAuthorDto - Dados do autor a serem atualizados (DTO).
     * @returns Uma Promise que resolve para a entidade AuthorEntity atualizada.
     */
    @Put(':id')
    @ApiOperation({ summary: 'Atualiza um autor existente' })
    @ApiParam({ name: 'id', description: 'ID do autor' })
    @ApiBody({ type: UpdateAuthorDto })
    @ApiResponse({ status: 200, description: 'Autor atualizado', type: AuthorEntity })
    async update(
        @Param('id') id: string,
        @Body() updateAuthorDto: UpdateAuthorDto,
    ): Promise<AuthorEntity> {
        return this.authorService.update(id, updateAuthorDto);
    }

    /**
     * Endpoint para remover um autor.
     * @param id - ID do autor a ser removido (parâmetro da rota).
     * @returns Uma Promise que resolve quando o autor é removido.
     */
    @Delete(':id')
    @ApiOperation({ summary: 'Remove um autor' })
    @ApiParam({ name: 'id', description: 'ID do autor' })
    @ApiResponse({ status: 200, description: 'Autor removido' })
    async delete(@Param('id') id: string): Promise<void> {
        return this.authorService.delete(id);
    }

    /**
     * Endpoint para buscar um autor pelo ID.
     * @param id - ID do autor a ser buscado (parâmetro da rota).
     * @returns Uma Promise que resolve para a entidade AuthorEntity encontrada, ou null se não existir.
     */
    @Get(':id')
    @ApiOperation({ summary: 'Busca autor por ID' })
    @ApiParam({ name: 'id', description: 'ID do autor' })
    @ApiResponse({ status: 200, description: 'Autor encontrado', type: AuthorEntity })
    @CacheTTL(300)
    async findById(@Param('id') id: string): Promise<AuthorEntity | null> {
        return this.authorService.findById(id);
    }

    /**
     * Endpoint para buscar um autor pelo slug.
     * @param slug - Slug do autor a ser buscado (parâmetro da rota).
     * @returns Uma Promise que resolve para a entidade AuthorEntity encontrada, ou null se não existir.
     */
    @Get('slug/:slug')
    @ApiOperation({ summary: 'Busca autor por slug' })
    @ApiParam({ name: 'slug', description: 'Slug do autor' })
    @ApiResponse({ status: 200, description: 'Autor encontrado', type: AuthorEntity })
    @CacheTTL(300)
    async findBySlug(@Param('slug') slug: string): Promise<AuthorEntity | null> {
        return this.authorService.findBySlug(slug);
    }

    /**
     * Endpoint para listar os autores mais recentes.
     * @param limit - Número máximo de autores a serem retornados (query parameter).
     * @returns Uma Promise que resolve para um array de entidades AuthorEntity.
     */
    @Get('recent')
    @ApiOperation({ summary: 'Lista autores recentes' })
    @ApiQuery({ name: 'limit', required: false, description: 'Número máximo de resultados' })
    @ApiResponse({ status: 200, description: 'Lista de autores', type: [AuthorEntity] })
    @CacheTTL(300)
    async listRecentAuthors(@Query('limit') limit: number = 10): Promise<AuthorEntity[]> {
        return this.authorService.listRecentAuthors(limit);
    }
}
