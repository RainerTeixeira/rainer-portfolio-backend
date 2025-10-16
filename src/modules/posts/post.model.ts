/**
 * Post Model
 * 
 * Modelo de dados para posts/artigos do blog.
 * Implementa hierarquia: Post → Subcategory → Category Principal
 * 
 * @module modules/posts/post.model
 */

/**
 * Enum de status de publicação do post
 * Sincronizado com Prisma schema
 */
export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  SCHEDULED = 'SCHEDULED',
  TRASH = 'TRASH',
}

/**
 * Interface completa do Post
 * Todos os campos sincronizados com Prisma schema
 */
export interface Post {
  /** ID único do post (MongoDB ObjectId) */
  id: string;
  
  /** Título do post */
  title: string;
  
  /** Slug único para URL SEO-friendly */
  slug: string;
  
  /** Conteúdo do post em formato JSON (Tiptap/Editor.js) */
  content: any; // Json do Prisma
  
  /** 
   * ID da subcategoria à qual o post pertence
   * CRÍTICO: Post sempre pertence a uma SUBCATEGORIA (não categoria direta)
   */
  subcategoryId: string;
  
  /** ID do autor do post */
  authorId: string;
  
  /** Status de publicação */
  status: PostStatus;
  
  /** Se o post é destaque */
  featured: boolean;
  
  /** Se permite comentários */
  allowComments: boolean;
  
  /** Se o post está fixado no topo */
  pinned: boolean;
  
  /** Prioridade para ordenação (maior = maior prioridade) */
  priority: number;
  
  /** Data de publicação (null se ainda não publicado) */
  publishedAt: Date | null;
  
  /** Data de criação */
  createdAt: Date;
  
  /** Data de última atualização */
  updatedAt: Date;
  
  /** Contador de visualizações */
  views: number;
  
  /** Contador de likes */
  likesCount: number;
  
  /** Contador de comentários */
  commentsCount: number;
  
  /** Contador de bookmarks (posts salvos) */
  bookmarksCount: number;
}

/**
 * DTO para criação de post
 * Campos obrigatórios e opcionais conforme regras de negócio
 */
export interface CreatePostData {
  /** Título do post (obrigatório) */
  title: string;
  
  /** Slug único (obrigatório) */
  slug: string;
  
  /** Conteúdo JSON (obrigatório) */
  content: any;
  
  /** 
   * ID da subcategoria (obrigatório)
   * IMPORTANTE: Use subcategoria, não categoria principal
   */
  subcategoryId: string;
  
  /** ID do autor (obrigatório) */
  authorId: string;
  
  /** Status (opcional, padrão: DRAFT) */
  status?: PostStatus;
  
  /** Featured (opcional, padrão: false) */
  featured?: boolean;
  
  /** Permite comentários (opcional, padrão: true) */
  allowComments?: boolean;
  
  /** Fixado (opcional, padrão: false) */
  pinned?: boolean;
  
  /** Prioridade (opcional, padrão: 0) */
  priority?: number;
  
  /** Data de publicação (opcional) */
  publishedAt?: Date | string;
}

/**
 * DTO para atualização de post
 * Todos os campos são opcionais
 */
export interface UpdatePostData {
  title?: string;
  slug?: string;
  content?: any;
  subcategoryId?: string;
  status?: PostStatus;
  featured?: boolean;
  allowComments?: boolean;
  pinned?: boolean;
  priority?: number;
  publishedAt?: Date | string | null;
}

/**
 * Post com relações populadas (para retorno de API)
 */
export interface PostWithRelations extends Post {
  author?: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  subcategory?: {
    id: string;
    name: string;
    slug: string;
    color?: string;
    parent?: {
      id: string;
      name: string;
      slug: string;
    };
  };
}
