import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

import { AuthorEntity } from './authors.entity';
import { AuthorRepository } from './author.repository';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

/**
 * Service responsável pela lógica de negócios relacionada à entidade Author.
 * Este serviço coordena as interações entre o controller, o repositório e o cache.
 * Utiliza o cache para otimizar as buscas frequentes de autores (por ID, slug ou lista de autores recentes).
 */
@Injectable()
export class AuthorService {
    constructor(
        private readonly authorRepository: AuthorRepository,

        /**
         * Injeção do gerenciador de cache (CacheManager).
         * O `CACHE_MANAGER` é fornecido pela biblioteca `@nestjs/cache-manager`, permitindo o uso de cache eficiente.
         */
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    /**
     * Cria um novo autor no repositório e invalida o cache de autores recentes.
     * Após a criação, o cache de autores é invalidado para garantir que os dados mais recentes
     * sejam retornados nas próximas consultas.
     * 
     * @param createAuthorDto - Dados do autor a ser criado.
     * @returns Uma instância de `AuthorEntity` representando o autor criado.
     */
    async create(createAuthorDto: CreateAuthorDto): Promise<AuthorEntity> {
        const author = await this.authorRepository.create(createAuthorDto);
        await this.invalidateCache(); // Invalida cache de autores
        return author;
    }

    /**
     * Atualiza um autor existente no repositório e invalida o cache relacionado.
     * Após a atualização, o cache para o autor específico e para a lista de autores recentes é invalidado,
     * garantindo que as próximas consultas reflitam os dados atualizados.
     * 
     * @param id - ID do autor a ser atualizado.
     * @param updateAuthorDto - Dados a serem atualizados do autor.
     * @returns A instância de `AuthorEntity` representando o autor atualizado.
     */
    async update(id: string, updateAuthorDto: UpdateAuthorDto): Promise<AuthorEntity> {
        const author = await this.authorRepository.update(id, updateAuthorDto);
        await this.invalidateCache(id); // Invalida o cache do autor
        return author;
    }

    /**
     * Remove um autor do repositório e invalida o cache relacionado.
     * Após a exclusão, o cache para o autor e para a lista de autores recentes é invalidado.
     * 
     * @param id - ID do autor a ser removido.
     */
    async delete(id: string): Promise<void> {
        await this.authorRepository.delete(id);
        await this.invalidateCache(id); // Invalida o cache do autor removido
    }

    /**
     * Busca um autor pelo ID, verificando primeiro no cache e, se não encontrado, consulta o repositório.
     * Se o autor for encontrado, o resultado é armazenado no cache com um TTL de 300 segundos.
     * 
     * @param id - ID do autor a ser buscado.
     * @returns Uma instância de `AuthorEntity` caso o autor seja encontrado ou `null` caso contrário.
     */
    async findById(id: string): Promise<AuthorEntity | null> {
        const cacheKey = `author_${id}`; // Chave para cache do autor
        const cached = await this.cacheManager.get<AuthorEntity>(cacheKey);

        // Retorna o autor do cache se encontrado
        if (cached) return cached;

        const author = await this.authorRepository.findById(id).catch(() => null);
        if (author) {
            await this.cacheManager.set(cacheKey, author, 300); // TTL de 300 segundos
        }
        return author ?? null;
    }

    /**
     * Busca um autor pelo slug, verificando primeiro no cache e, se não encontrado, consulta o repositório.
     * Se o autor for encontrado, o resultado é armazenado no cache com um TTL de 300 segundos.
     * 
     * @param slug - Slug do autor a ser buscado.
     * @returns Uma instância de `AuthorEntity` caso o autor seja encontrado ou `null` caso contrário.
     */
    async findBySlug(slug: string): Promise<AuthorEntity | null> {
        const cacheKey = `author_slug_${slug}`; // Chave para cache do autor por slug
        const cached = await this.cacheManager.get<AuthorEntity>(cacheKey);

        // Retorna o autor do cache se encontrado
        if (cached) return cached;

        try {
            const author = await this.authorRepository.findBySlug(slug);
            // Armazena o autor no cache por 300 segundos, se encontrado
            if (author) {
                await this.cacheManager.set(cacheKey, author, 300); // TTL de 300 segundos
            }
            return author;
        } catch (error) {
            if (error instanceof NotFoundException) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Retorna uma lista de autores mais recentes com base em um limite especificado.
     * A busca é otimizada com o uso de cache, e os resultados são armazenados no cache com um TTL de 600 segundos.
     * 
     * @param limit - Número máximo de autores a serem retornados.
     * @returns Um array de instâncias de `AuthorEntity` representando os autores mais recentes.
     */
    async listRecentAuthors(limit: number): Promise<AuthorEntity[]> {
        const cacheKey = `recent_authors_${limit}`; // Chave para cache dos autores recentes
        const cached = await this.cacheManager.get<AuthorEntity[]>(cacheKey);

        // Retorna os autores do cache se encontrados
        if (cached) return cached;

        const authors = await this.authorRepository.listRecentAuthors(limit);

        // Armazena os autores no cache por 600 segundos, se encontrados
        if (authors.length) {
            await this.cacheManager.set(cacheKey, authors, 600); // TTL de 600 segundos
        }

        return authors;
    }

    /**
     * Invalida o cache relacionado ao autor e à lista de autores recentes.
     * Se um `id` de autor for fornecido, o cache do autor específico e do seu slug é invalidado.
     * Além disso, os caches relacionados à lista de autores mais recentes são invalidado com base no limite.
     * 
     * @param id - (Opcional) ID do autor para invalidação do cache.
     */
    private async invalidateCache(id?: string): Promise<void> {
        if (id) {
            // Invalida o cache do autor específico
            await this.cacheManager.del(`author_${id}`);
            // Busca o autor para obter o slug e invalidar o cache do slug
            try {
                const author = await this.authorRepository.findById(id);
                if (author?.slug) {
                    await this.cacheManager.del(`author_slug_${author.slug}`);
                }
            } catch {
                // Ignora erro caso o autor não exista mais
            }
        }

        // Invalida caches dos autores mais recentes
        await this.cacheManager.del('recent_authors_10');
        await this.cacheManager.del('recent_authors_5');

        // Alternativa mais agressiva (use com cautela, em ambientes de desenvolvimento)
        // await this.cacheManager.reset(); // Limpa todo o cache
    }
}
