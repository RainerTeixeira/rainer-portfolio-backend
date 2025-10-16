/**
 * Schemas de Validação para Bookmarks
 * 
 * Define schemas Zod para validação de dados de bookmarks (posts salvos).
 * 
 * @module schemas/bookmarks
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS DE ENTRADA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Schema para criar um bookmark
 */
export const createBookmarkSchema = z.object({
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
  postId: z.string().min(1, 'ID do post é obrigatório'),
  collection: z.string().max(100, 'Nome da coleção deve ter no máximo 100 caracteres').optional(),
  notes: z.string().max(500, 'Notas devem ter no máximo 500 caracteres').optional(),
});

/**
 * Schema para atualizar um bookmark
 */
const bookmarkSchemaBase = z.object({
  collection: z.string().max(100, 'Nome da coleção deve ter no máximo 100 caracteres').optional(),
  notes: z.string().max(500, 'Notas devem ter no máximo 500 caracteres').optional(),
});

export const updateBookmarkSchema = bookmarkSchemaBase.partial();

/**
 * Schema para query de listagem de bookmarks
 */
export const listBookmarksQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  collection: z.string().optional(), // Filtrar por coleção
});

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS DE PARÂMETROS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Schema para parâmetros de ID
 */
export const bookmarkIdParamSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
});

/**
 * Schema para parâmetros de user ID
 */
export const userIdParamSchema = z.object({
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
});

/**
 * Schema para parâmetros de post ID
 */
export const postIdParamSchema = z.object({
  postId: z.string().min(1, 'ID do post é obrigatório'),
});

// ═══════════════════════════════════════════════════════════════════════════
// TYPES INFERIDOS
// ═══════════════════════════════════════════════════════════════════════════

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;
export type UpdateBookmarkInput = z.infer<typeof updateBookmarkSchema>;
export type ListBookmarksQuery = z.infer<typeof listBookmarksQuerySchema>;
export type BookmarkIdParam = z.infer<typeof bookmarkIdParamSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type PostIdParam = z.infer<typeof postIdParamSchema>;

