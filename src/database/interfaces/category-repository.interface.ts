/**
 * Interface do repositório de categorias (contrato)
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  order?: number;
  parentId?: string;
  postsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryRepository {
  create(data: Omit<Category, 'createdAt' | 'updatedAt'>): Promise<Category>;
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  update(id: string, data: Partial<Category>): Promise<Category | null>;
  delete(id: string): Promise<void>;
}

export const CATEGORY_REPOSITORY = 'CATEGORY_REPOSITORY';
