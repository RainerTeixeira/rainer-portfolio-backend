import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CommentRepository } from './comments.repository';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentEntity } from './comments.entity';

/**
 * Serviço responsável por gerenciar as operações relacionadas aos comentários do blog.
 * Utiliza repositório para persistência e cache para otimização de consultas.
 */
@Injectable()
export class CommentService {
    /**
     * Injeta o repositório de comentários e o gerenciador de cache.
     * @param commentRepository Repositório para operações de banco de dados de comentários.
     * @param cacheManager Gerenciador de cache para otimizar buscas.
     */
    constructor(
        private readonly commentRepository: CommentRepository,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) { }

    /**
     * Cria um novo comentário.
     * Após a criação, remove o cache relacionado ao comentário criado (caso exista).
     * @param createDto Dados para criar um comentário.
     * @returns A entidade do comentário criado.
     */
    async create(createDto: CreateCommentDto): Promise<CommentEntity> {
        const comment = await this.commentRepository.create(createDto);
        // Corrigido: usa comment.sk (que contém o timestamp)
        await this.cacheManager.del(`comment_${comment.postId}_${comment.sk}`);
        return comment;
    }

    /**
     * Busca um comentário específico pelo postId e timestamp.
     * Utiliza cache para otimizar a consulta. Caso não encontre no cache, busca no banco e armazena no cache.
     * @param postId ID do post relacionado ao comentário.
     * @param timestamp Timestamp do comentário.
     * @returns A entidade do comentário encontrada.
     */
    async findById(postId: string, timestamp: string): Promise<CommentEntity> {
        const cacheKey = `comment_${postId}_${timestamp}`;
        const cachedComment = await this.cacheManager.get<CommentEntity>(cacheKey);

        if (cachedComment) {
            return cachedComment;
        }

        const comment = await this.commentRepository.findById(postId, timestamp);
        await this.cacheManager.set(cacheKey, comment);
        return comment;
    }

    /**
     * Atualiza um comentário existente.
     * Após a atualização, atualiza o cache correspondente.
     * @param postId ID do post relacionado ao comentário.
     * @param timestamp Timestamp do comentário.
     * @param updateDto Dados para atualizar o comentário.
     * @returns A entidade do comentário atualizada.
     */
    async update(postId: string, timestamp: string, updateDto: UpdateCommentDto): Promise<CommentEntity> {
        const comment = await this.commentRepository.update(postId, timestamp, updateDto);
        await this.cacheManager.set(`comment_${postId}_${timestamp}`, comment);
        return comment;
    }

    /**
     * Remove um comentário pelo postId e timestamp.
     * Após a remoção, exclui o cache correspondente.
     * @param postId ID do post relacionado ao comentário.
     * @param timestamp Timestamp do comentário.
     */
    async delete(postId: string, timestamp: string): Promise<void> {
        await this.commentRepository.delete(postId, timestamp);
        await this.cacheManager.del(`comment_${postId}_${timestamp}`);
    }

    /**
     * Busca todos os comentários de um post específico.
     * @param postId ID do post para buscar os comentários.
     * @returns Lista de comentários do post.
     */
    async findCommentsByPost(postId: string): Promise<CommentEntity[]> {
        return await this.commentRepository.findCommentsByPost(postId);
    }

    /**
     * Busca todos os comentários de um usuário específico.
     * @param userId ID do usuário para buscar os comentários.
     * @returns Lista de comentários do usuário.
     */
    async findCommentsByUser(userId: string): Promise<CommentEntity[]> {
        return await this.commentRepository.findCommentsByUser(userId);
    }
}