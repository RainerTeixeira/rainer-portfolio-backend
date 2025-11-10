/**
 * Modelo de Categoria
 * 
 * Interfaces TypeScript para o modelo Category.
 * 
 * @module modules/categories/category.model
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  coverImage?: string | null;
  parentId?: string | null;
  order: number;
  metaDescription?: string | null;
  isActive: boolean;
  postsCount: number;
  createdAt: Date;
  /** Data de última atualização (null até primeira atualização real - economia de espaço) */
  updatedAt: Date | null;
}

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  coverImage?: string;
  parentId?: string;
  order?: number;
  metaDescription?: string;
  isActive?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  color?: string;
  icon?: string;
  coverImage?: string;
  parentId?: string;
  order?: number;
  metaDescription?: string;
  isActive?: boolean;
}

