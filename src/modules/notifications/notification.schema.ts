/**
 * Schemas de Validação para Notifications
 * 
 * Define schemas Zod para validação de dados de notificações.
 * 
 * @module schemas/notifications
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════

export const NotificationTypeEnum = z.enum([
  'NEW_COMMENT',
  'NEW_LIKE',
  'NEW_FOLLOWER',
  'POST_PUBLISHED',
  'MENTION',
  'SYSTEM',
]);

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS DE ENTRADA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Schema para criar uma notificação
 */
export const createNotificationSchema = z.object({
  type: NotificationTypeEnum,
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título deve ter no máximo 200 caracteres'),
  message: z.string().min(1, 'Mensagem é obrigatória').max(500, 'Mensagem deve ter no máximo 500 caracteres'),
  link: z.string().url('Link deve ser uma URL válida').optional(),
  metadata: z.any().optional(), // JSON arbitrário
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
});

/**
 * Schema para query de listagem de notificações
 */
export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  unreadOnly: z.coerce.boolean().optional(), // Mostrar apenas não lidas
});

/**
 * Schema para marcar múltiplas notificações como lidas
 */
export const markMultipleAsReadSchema = z.object({
  ids: z.array(z.string()).min(1, 'Pelo menos um ID é obrigatório'),
});

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS DE PARÂMETROS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Schema para parâmetros de ID
 */
export const notificationIdParamSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
});

/**
 * Schema para parâmetros de user ID
 */
export const userIdParamSchema = z.object({
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
});

// ═══════════════════════════════════════════════════════════════════════════
// TYPES INFERIDOS
// ═══════════════════════════════════════════════════════════════════════════

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
export type MarkMultipleAsReadInput = z.infer<typeof markMultipleAsReadSchema>;
export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type NotificationType = z.infer<typeof NotificationTypeEnum>;

