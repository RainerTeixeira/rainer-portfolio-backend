/**
 * Category Schemas - Validação Zod
 * 
 * Schemas de validação para categorias usando Zod.
 * 
 * @module modules/categories/category.schema
 */

import { z } from 'zod';

/**
 * Schema base de categoria
 */
const categorySchemaBase = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um código hexadecimal válido').optional(),
  icon: z.string().max(50).optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  order: z.number().int().min(0).optional().default(0),
});

/**
 * Schema para criar categoria
 */
export const createCategorySchema = categorySchemaBase;

/**
 * Schema para atualizar categoria
 */
export const updateCategorySchema = categorySchemaBase.partial();

/**
 * Types inferidos
 */
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

