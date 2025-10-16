/**
 * Posts Repository
 * 
 * Camada de acesso a dados para posts.
 * Implementa padrão Repository com injeção de dependência.
 * 
 * @module modules/posts/posts.repository
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Post, CreatePostData, UpdatePostData, PostWithRelations } from './post.model.js';
import { Prisma } from '@prisma/client';

/**
 * Repositório de Posts
 * Usa Prisma Client injetado via DI
 */
@Injectable()
export class PostsRepository {
  private readonly logger = new Logger(PostsRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo post
   * 
   * @param data - Dados para criar o post
   * @returns Post criado
   */
  async create(data: CreatePostData): Promise<Post> {
    this.logger.log(`Creating post: ${data.title}`);
    
    const postData: Prisma.PostCreateInput = {
      title: data.title,
      slug: data.slug,
      content: data.content,
      status: data.status || 'DRAFT',
      featured: data.featured ?? false,
      allowComments: data.allowComments ?? true,
      pinned: data.pinned ?? false,
      priority: data.priority ?? 0,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      author: {
        connect: { id: data.authorId }
      },
      subcategory: {
        connect: { id: data.subcategoryId }
      }
    };

    return await this.prisma.post.create({ 
      data: postData 
    }) as Post;
  }

  /**
   * Busca post por ID com relações
   * 
   * @param id - ID do post
   * @returns Post com autor e subcategoria populados, ou null
   */
  async findById(id: string): Promise<PostWithRelations | null> {
    this.logger.log(`Finding post by ID: ${id}`);
    
    return await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          }
        },
        subcategory: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
              }
            }
          }
        }
      },
    }) as PostWithRelations | null;
  }

  /**
   * Busca post por slug
   * 
   * @param slug - Slug do post
   * @returns Post encontrado ou null
   */
  async findBySlug(slug: string): Promise<PostWithRelations | null> {
    this.logger.log(`Finding post by slug: ${slug}`);
    
    return await this.prisma.post.findUnique({ 
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          }
        },
        subcategory: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          }
        }
      },
    }) as PostWithRelations | null;
  }

  /**
   * Lista posts com paginação e filtros
   * 
   * @param params - Parâmetros de busca
   * @returns Posts paginados
   */
  async findMany(params: {
    page?: number;
    limit?: number;
    status?: string;
    subcategoryId?: string;
    authorId?: string;
    featured?: boolean;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {};
    
    if (params.status) where.status = params.status as any;
    if (params.subcategoryId) where.subcategoryId = params.subcategoryId;
    if (params.authorId) where.authorId = params.authorId;
    if (params.featured !== undefined) where.featured = params.featured;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({ 
        where, 
        skip, 
        take: limit, 
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            }
          },
          subcategory: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            }
          }
        }
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      posts: posts as PostWithRelations[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Atualiza um post
   * 
   * @param id - ID do post
   * @param data - Dados para atualizar
   * @returns Post atualizado
   */
  async update(id: string, data: UpdatePostData): Promise<Post> {
    this.logger.log(`Updating post: ${id}`);
    
    const updateData: Prisma.PostUpdateInput = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.featured !== undefined) updateData.featured = data.featured;
    if (data.allowComments !== undefined) updateData.allowComments = data.allowComments;
    if (data.pinned !== undefined) updateData.pinned = data.pinned;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
    }
    if (data.subcategoryId !== undefined) {
      updateData.subcategory = { connect: { id: data.subcategoryId } };
    }

    return await this.prisma.post.update({ 
      where: { id }, 
      data: updateData 
    }) as Post;
  }

  /**
   * Deleta um post
   * 
   * @param id - ID do post
   * @returns Sucesso da operação
   */
  async delete(id: string): Promise<boolean> {
    this.logger.log(`Deleting post: ${id}`);
    
    await this.prisma.post.delete({ where: { id } });
    return true;
  }

  /**
   * Incrementa contador de visualizações
   * 
   * @param id - ID do post
   */
  async incrementViews(id: string): Promise<void> {
    await this.prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  }

  /**
   * Busca posts por subcategoria
   * 
   * @param subcategoryId - ID da subcategoria
   * @returns Posts da subcategoria
   */
  async findBySubcategory(subcategoryId: string): Promise<Post[]> {
    this.logger.log(`Finding posts by subcategory: ${subcategoryId}`);
    
    return await this.prisma.post.findMany({
      where: { 
        subcategoryId,
        status: 'PUBLISHED'
      },
      orderBy: { publishedAt: 'desc' }
    }) as Post[];
  }

  /**
   * Busca posts por autor
   * 
   * @param authorId - ID do autor
   * @returns Posts do autor
   */
  async findByAuthor(authorId: string): Promise<Post[]> {
    this.logger.log(`Finding posts by author: ${authorId}`);
    
    return await this.prisma.post.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' }
    }) as Post[];
  }
}
