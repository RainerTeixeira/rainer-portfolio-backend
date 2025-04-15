import { Injectable, NotFoundException, Inject, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER, Inject } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AuthorRepository } from '@src/modules/blog/authors/author.repository.ts';
import { CreateAuthorDto } from '@src/modules/blog/authors/dto/create-author.dto.ts';
import { UpdateAuthorDto } from '@src/modules/blog/authors/dto/update-author.dto.ts';
import { AuthorEntity } from '@src/modules/blog/authors/authors.entity.ts';

/**
 * Serviço responsável pela gestão de autores no módulo de blog.
 * Fornece operações de CRUD, validação de dados e caching para otimizar o acesso.
 *
 * Funcionalidades:
 * - Criação, listagem, busca, atualização e remoção de autores.
 * - Validação de dados de entrada (nome e e-mail).
 * - Cache de consultas para melhorar a performance.
 *
 * @author
 * @module AuthorsService
 */

@Injectable()
export class AuthorsService {
    private readonly cacheTtl = 300; // 5 minutos

    /**
     * Injeta o repositório de autores e o gerenciador de cache.
     * @param repository Repositório para operações de persistência de autores.
     * @param cache Gerenciador de cache.
     */
    constructor(
        private readonly repository: AuthorRepository,
        @Inject(CACHE_MANAGER) private cache: Cache
    ) { }

    /**
     * Cria um novo autor após validar os dados.
     * Invalida o cache da lista de autores.
     * @param dto Dados para criação do autor.
     * @returns Autor criado.
     * @throws BadRequestException se nome ou e-mail forem inválidos.
     */
    async create(dto: CreateAuthorDto): Promise<AuthorEntity> {
        if (!dto.name || dto.name.trim() === '') {
            throw new BadRequestException('Author name cannot be empty');
        }
        if (dto.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
            throw new BadRequestException('Invalid email format');
        }
        const author = new AuthorEntity(dto);
        await this.invalidateListCache();
        return this.repository.create(author);
    }

    /**
     * Retorna todos os autores, utilizando cache para otimizar a consulta.
     * @returns Lista de autores.
     */
    async findAll(): Promise<AuthorEntity[]> {
        const cacheKey = 'authors:all';
        const cached = await this.cache.get<AuthorEntity[]>(cacheKey);
        if (cached) return cached;

        // Implementar busca paginada em produção
        const authors = await this.repository.findAll();
        await this.cache.set(cacheKey, authors, this.cacheTtl);
        return authors;
    }

    /**
     * Busca um autor pelo ID, utilizando cache.
     * @param id Identificador do autor.
     * @returns Autor encontrado.
     * @throws NotFoundException se o autor não existir.
     */
    async findOne(id: string): Promise<AuthorEntity> {
        const cacheKey = `author:${id}`;
        const cached = await this.cache.get<AuthorEntity>(cacheKey);
        if (cached) return cached;

        const author = await this.repository.findById(id);
        if (!author) throw new NotFoundException('Author not found');

        await this.cache.set(cacheKey, author, this.cacheTtl);
        return author;
    }

    /**
     * Atualiza os dados de um autor existente.
     * Valida os dados e invalida o cache relacionado.
     * @param id Identificador do autor.
     * @param dto Dados para atualização.
     * @returns Autor atualizado.
     * @throws BadRequestException se nome ou e-mail forem inválidos.
     */
    async update(id: string, dto: UpdateAuthorDto): Promise<AuthorEntity> {
        const author = await this.findOne(id);
        if (dto.name !== undefined && (dto.name === null || dto.name.trim() === '')) {
            throw new BadRequestException('Author name cannot be empty');
        }
        if (dto.email !== undefined && (dto.email === null || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email))) {
            throw new BadRequestException('Invalid email format');
        }
        const updatedAuthor = new AuthorEntity({ ...author, ...dto });

        await this.invalidateCache(id);
        return this.repository.update(id, updatedAuthor);
    }

    /**
     * Remove um autor pelo ID e invalida o cache relacionado.
     * @param id Identificador do autor.
     */
    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
        await this.invalidateCache(id);
    }

    /**
     * Invalida o cache de um autor específico e da lista de autores.
     * @param id Identificador do autor.
     */
    private async invalidateCache(id: string): Promise<void> {
        await Promise.all([
            this.cache.del(`author:${id}`),
            this.cache.del('authors:all')
        ]);
    }

    /**
     * Invalida apenas o cache da lista de autores.
     */
    private async invalidateListCache(): Promise<void> {
        await this.cache.del('authors:all');
    }
}