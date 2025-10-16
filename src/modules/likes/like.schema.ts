/**
 * Schemas de Validação para Likes
 * 
 * Define schemas Zod para validação de dados de likes (curtidas).
 * 
 * @module schemas/likes
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS DE ENTRADA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Schema para criar um like
 */
export const createLikeSchema = z.object({
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
  postId: z.string().min(1, 'ID do post é obrigatório'),
});

/**
 * Schema para query de listagem de likes
 */
export const listLikesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS DE PARÂMETROS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Schema para parâmetros de ID
 */
export const likeIdParamSchema = z.object({
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

export type CreateLikeInput = z.infer<typeof createLikeSchema>;
export type ListLikesQuery = z.infer<typeof listLikesQuerySchema>;
export type LikeIdParam = z.infer<typeof likeIdParamSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type PostIdParam = z.infer<typeof postIdParamSchema>;

