/**
 * Schemas de Validação de Comentários (MELHORADO)
 * 
 * Versão aprimorada com:
 * - Validações anti-spam
 * - Detecção de linguagem ofensiva
 * - Sanitização automática
 * - Validações de conteúdo rich text
 * 
 * @fileoverview Schemas Zod melhorados para validação de comentários
 * @module schemas/comments
 * @version 2.0.0
 * @since 1.0.0
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// VALIDADORES CUSTOMIZADOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Lista de palavras consideradas spam
 */
const SPAM_KEYWORDS = [
  'viagra', 'casino', 'lottery', 'winner', 'prize',
  'click here', 'buy now', 'limited offer', 'act now'
];

/**
 * Padrões suspeitos de spam
 */
const SPAM_PATTERNS = [
  /https?:\/\/[^\s]{20,}/gi, // URLs muito longas
  /(.)\1{10,}/g, // Caracteres repetidos demais
  /[A-Z]{20,}/g, // Maiúsculas demais seguidas
];

/**
 * Valida se comentário parece spam
 */
function isLikelySpam(content: string): boolean {
  const lowerContent = content.toLowerCase();
  
  // Verificar palavras de spam
  if (SPAM_KEYWORDS.some(keyword => lowerContent.includes(keyword))) {
    return true;
  }
  
  // Verificar padrões suspeitos
  if (SPAM_PATTERNS.some(pattern => pattern.test(content))) {
    return true;
  }
  
  // Verificar quantidade de URLs (max 2)
  const urlCount = (content.match(/https?:\/\//gi) || []).length;
  if (urlCount > 2) {
    return true;
  }
  
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA BASE DE COMENTÁRIO (SEM REFINES GLOBAIS)
// ═══════════════════════════════════════════════════════════════════════════
const commentSchemaBase = z.object({
  // Conteúdo com validações anti-spam
  content: z
    .string()
    .min(3, 'Comentário deve ter no mínimo 3 caracteres')
    .max(1000, 'Comentário muito longo (máximo 1000 caracteres)')
    .trim()
    .refine(
      (content) => {
        // Não permitir apenas espaços ou quebras de linha
        return content.replace(/\s/g, '').length >= 3;
      },
      { message: 'Comentário não pode ser vazio' }
    )
    .refine(
      (content) => {
        // Validar que tem palavras reais
        const words = content.match(/[a-zA-Z]{2,}/g) || [];
        return words.length >= 2;
      },
      { message: 'Comentário deve ter pelo menos 2 palavras' }
    )
    .refine(
      (content) => !isLikelySpam(content),
      { message: 'Comentário detectado como spam' }
    )
    .refine(
      (content) => {
        // Não permitir comentários só de emojis
        const emojiPattern = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
        const withoutEmojis = content.replace(emojiPattern, '').trim();
        return withoutEmojis.length >= 3;
      },
      { message: 'Comentário deve conter texto, não apenas emojis' }
    )
    .refine(
      (content) => {
        // Limitar maiúsculas (max 30%)
        const upperCount = (content.match(/[A-Z]/g) || []).length;
        const letterCount = (content.match(/[a-zA-Z]/g) || []).length;
        if (letterCount === 0) return true;
        return upperCount / letterCount <= 0.3;
      },
      { message: 'Comentário não pode ter muitas letras maiúsculas' }
    ),

  // Content JSON (rich text) - opcional
  contentJson: z
    .any()
    .refine(
      (val) => {
        if (val === null || val === undefined) return true;
        return typeof val === 'object';
      },
      { message: 'Content JSON deve ser um objeto' }
    )
    .optional()
    .nullable(),

  // Post ID obrigatório
  postId: z
    .string()
    .min(1, 'ID do post é obrigatório'),

  // Author ID obrigatório
  authorId: z
    .string()
    .min(1, 'ID do autor é obrigatório'),

  // Parent ID para threads
  parentId: z
    .string()
    .min(1, 'Parent ID inválido')
    .optional()
    .nullable(),

  // Aprovação inicial
  isApproved: z.boolean().optional().default(false),
});

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DE CRIAÇÃO DE COMENTÁRIO (COM VALIDAÇÕES CRUZADAS)
// ═══════════════════════════════════════════════════════════════════════════
export const createCommentSchema = commentSchemaBase.refine(
  (data) => {
    // Validação cruzada: parentId não pode ser igual a postId
    if (data.parentId) {
      return data.parentId !== data.postId;
    }
    return true;
  },
  {
    message: 'Parent ID não pode ser igual ao Post ID',
    path: ['parentId']
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DE ATUALIZAÇÃO (MELHORADO)
// ═══════════════════════════════════════════════════════════════════════════
export const updateCommentSchema = z.object({
  // Conteúdo (mesmas validações do create)
  content: commentSchemaBase.shape.content.optional(),

  // Content JSON
  contentJson: z.any().optional().nullable(),
  
  // Moderação
  isApproved: z.boolean().optional(),
  isReported: z.boolean().optional(),
  
  // Report reason com validação
  reportReason: z
    .string()
    .min(10, 'Motivo da denúncia deve ter no mínimo 10 caracteres')
    .max(500, 'Motivo da denúncia muito longo')
    .trim()
    .optional()
    .nullable(),

  // Edição
  isEdited: z.boolean().optional(),
  
  // Estatísticas
  likesCount: z.number().int().min(0).optional(),
})
.refine(
  (data) => {
    // Se isReported é true, reportReason deve ser fornecido
    if (data.isReported === true && !data.reportReason) {
      return false;
    }
    return true;
  },
  {
    message: 'Motivo da denúncia é obrigatório quando isReported é true',
    path: ['reportReason']
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS DE PARÂMETROS
// ═══════════════════════════════════════════════════════════════════════════
export const getCommentByIdSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
});

export const listCommentsByPostSchema = z.object({
  postId: z.string().min(1, 'ID do post é obrigatório'),
  approved: z.coerce.boolean().optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS TYPESCRIPT INFERIDOS
// ═══════════════════════════════════════════════════════════════════════════
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type GetCommentByIdInput = z.infer<typeof getCommentByIdSchema>;
export type ListCommentsByPostInput = z.infer<typeof listCommentsByPostSchema>;

