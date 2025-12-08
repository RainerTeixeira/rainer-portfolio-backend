/**
 * Repositório de Posts
 * 
 * Camada de acesso a dados para posts.
 * Implementa padrão Repository com injeção de dependência.
 * 
 * @module modules/posts/posts.repository
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import type { Post, CreatePostData, UpdatePostData, PostWithRelations } from './post.model.js';

// Tipo auxiliar para posts com includes (simplificado como any para evitar dependência forte de tipos do Prisma)
type PostWithIncludes = {
  include: {
    author: {
      select: {
        cognitoSub: true;
        fullName: true;
      };
    };
    subcategory: {
      select: {
        id: true;
        name: true;
        slug: true;
        color: true;
        parent?: {
          select: {
            id: true;
            name: true;
            slug: true;
          };
        };
      };
    };
  };
} & Record<string, any>;

/**
 * Repositório de Posts
 * Usa Prisma Client injetado via DI
 */
@Injectable()
export class PostsRepository {
  private readonly logger = new Logger(PostsRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Cria um novo post
   * 
   * @param data - Dados para criar o post
   * @returns Post criado
   */
  async create(data: CreatePostData): Promise<Post> {
    this.logger.log(`Creating post: ${data.title}`);
    
    const postData: any = {
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
        connect: { cognitoSub: data.authorId }
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
    
    try {
      const post = await this.prisma.post.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              cognitoSub: true, // cognitoSub é a chave primária agora
              fullName: true,
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
      }) as PostWithIncludes | null;

      if (!post) return null;

      // Mapeia cognitoSub para id no author (formato esperado pelo frontend)
      // Nota: nickname não está no MongoDB (gerenciado apenas pelo Cognito)
      return {
        ...post,
        author: post.author ? {
          id: post.author.cognitoSub, // Mapeia cognitoSub para id
          nickname: post.author.fullName.split(' ')[0] || '', // Usa primeira palavra do fullName como fallback
          fullName: post.author.fullName,
          avatar: this.cloudinaryService.getPublicUrlFromId(post.author.cognitoSub) || undefined,
        } : undefined,
        // Se subcategory não foi encontrada (foi deletada), retorna undefined
        subcategory: post.subcategory || undefined,
      } as unknown as PostWithRelations;
    } catch (error: any) {
      // Se o erro for relacionado a subcategory não encontrada, busca sem include
      if (error?.code === 'P2025' || error?.message?.includes('subcategory')) {
        this.logger.warn(`Subcategory not found for post ${id}, fetching without relations`);
        const post = await this.prisma.post.findUnique({
          where: { id },
          include: {
            author: {
              select: {
                cognitoSub: true,
                fullName: true,
              }
            },
          },
        }) as any;
        
        if (!post) return null;
        
        return {
          ...post,
          author: post.author ? {
            id: post.author.cognitoSub,
            nickname: post.author.fullName.split(' ')[0] || '',
            fullName: post.author.fullName,
            avatar: this.cloudinaryService.getPublicUrlFromId(post.author.cognitoSub) || undefined,
          } : undefined,
          subcategory: undefined,
        } as PostWithRelations;
      }
      throw error;
    }
  }

  /**
   * Busca post por slug
   * 
   * @param slug - Slug do post
   * @returns Post encontrado ou null
   */
  async findBySlug(slug: string): Promise<PostWithRelations | null> {
    this.logger.log(`Finding post by slug: ${slug}`);
    
    try {
      const post = await this.prisma.post.findUnique({ 
        where: { slug },
        include: {
          author: {
            select: {
              cognitoSub: true, // cognitoSub é a chave primária agora
              fullName: true,
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
      }) as PostWithIncludes | null;

      if (!post) return null;

      // Mapeia cognitoSub para id no author (formato esperado pelo frontend)
      // Nota: nickname não está no MongoDB (gerenciado apenas pelo Cognito)
      return {
        ...post,
        author: post.author ? {
          id: post.author.cognitoSub, // Mapeia cognitoSub para id
          nickname: post.author.fullName.split(' ')[0] || '', // Usa primeira palavra do fullName como fallback
          fullName: post.author.fullName,
          avatar: post.author.avatar || undefined,
        } : undefined,
        // Se subcategory não foi encontrada (foi deletada), retorna undefined
        subcategory: post.subcategory || undefined,
      } as unknown as PostWithRelations;
    } catch (error: any) {
      // Se o erro for relacionado a subcategory não encontrada, busca sem include
      if (error?.code === 'P2025' || error?.message?.includes('subcategory')) {
        this.logger.warn(`Subcategory not found for post ${slug}, fetching without relations`);
        const post = await this.prisma.post.findUnique({
          where: { slug },
          include: {
            author: {
              select: {
                cognitoSub: true,
                fullName: true,
              }
            },
          },
        }) as any;
        
        if (!post) return null;
        
        return {
          ...post,
          author: post.author ? {
            id: post.author.cognitoSub,
            nickname: post.author.fullName.split(' ')[0] || '',
            fullName: post.author.fullName,
            avatar: post.author.avatar || undefined,
          } : undefined,
          subcategory: undefined,
        } as PostWithRelations;
      }
      throw error;
    }
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

    const where: any = {};
    
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
              cognitoSub: true, // cognitoSub é a chave primária agora
              fullName: true,
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

    // Mapeia os posts para transformar cognitoSub em id no author (formato esperado pelo frontend)
    // Nota: nickname não está no MongoDB (gerenciado apenas pelo Cognito), usa primeira palavra do fullName como fallback
    const mappedPosts = posts.map((post: any) => ({
      ...post,
      author: post.author ? {
        id: post.author.cognitoSub, // Mapeia cognitoSub para id
        nickname: post.author.fullName.split(' ')[0] || '', // Usa primeira palavra do fullName como fallback
        fullName: post.author.fullName,
        avatar: this.cloudinaryService.getPublicUrlFromId(post.author.cognitoSub) || undefined,
      } : undefined,
    }));

    return {
      posts: mappedPosts as PostWithRelations[],
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
    
    const updateData: any = {};
    
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

    // Atualiza updatedAt apenas quando há uma atualização real
    updateData.updatedAt = new Date();

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
      data: { 
        views: { increment: 1 },
        updatedAt: new Date(), // Atualiza quando há mudança real
      },
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
