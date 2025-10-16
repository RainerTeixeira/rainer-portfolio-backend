/**
 * Schemas de Validação de Posts (MELHORADO)
 * 
 * Versão aprimorada com:
 * - Refinements avançados para conteúdo Tiptap
 * - Validações de SEO (título, slug)
 * - Sanitização automática
 * - Transformações inteligentes
 * 
 * @fileoverview Schemas Zod melhorados para validação de posts
 * @module schemas/posts
 * @version 2.0.0
 * @since 1.0.0
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// VALIDADORES CUSTOMIZADOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Lista de palavras proibidas em títulos
 */
const FORBIDDEN_WORDS = ['spam', 'scam', 'clickbait', 'fake'];

/**
 * Valida estrutura profunda do Tiptap
 */
function validateTiptapStructure(content: any): boolean {
  if (typeof content !== 'object' || content === null) return false;
  if (content.type !== 'doc') return false;
  if (!Array.isArray(content.content)) return false;
  if (content.content.length === 0) return false;
  
  // Validar que tem pelo menos um parágrafo com texto
  const hasContent = content.content.some((node: any) => {
    if (node.type === 'paragraph' && Array.isArray(node.content)) {
      return node.content.some((child: any) => 
        child.type === 'text' && child.text && child.text.trim().length > 0
      );
    }
    return false;
  });
  
  return hasContent;
}

/**
 * Conta palavras no conteúdo Tiptap
 */
function countWords(content: any): number {
  if (!content || !Array.isArray(content.content)) return 0;
  
  let wordCount = 0;
  
  function traverse(node: any) {
    if (node.type === 'text' && node.text) {
      wordCount += node.text.trim().split(/\s+/).filter(Boolean).length;
    }
    if (Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }
  
  content.content.forEach(traverse);
  return wordCount;
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA BASE DE POST (SEM REFINES GLOBAIS)
// ═══════════════════════════════════════════════════════════════════════════
const postSchemaBase = z.object({
  // Título com validações SEO
  title: z
    .string()
    .min(10, 'Título deve ter no mínimo 10 caracteres para SEO')
    .max(100, 'Título deve ter no máximo 100 caracteres para SEO')
    .trim()
    .refine(
      (title) => !FORBIDDEN_WORDS.some(word => title.toLowerCase().includes(word)),
      { message: 'Título contém palavras proibidas' }
    )
    .refine(
      (title) => {
        // Validar que não é apenas maiúsculas (clickbait)
        const upperCaseCount = (title.match(/[A-Z]/g) || []).length;
        return upperCaseCount < title.length * 0.5;
      },
      { message: 'Título não pode estar todo em maiúsculas' }
    )
    .refine(
      (title) => {
        // Validar pontuação excessiva
        const punctuation = (title.match(/[!?]{2,}/g) || []).length;
        return punctuation === 0;
      },
      { message: 'Título não pode ter pontuação excessiva (!!!, ???)' }
    )
    .refine(
      (title) => {
        // Validar que tem palavras reais (não só números/símbolos)
        const words = title.match(/[a-zA-Z]{2,}/g) || [];
        return words.length >= 2;
      },
      { message: 'Título deve conter pelo menos 2 palavras' }
    ),

  // Slug com validação rigorosa
  slug: z
    .string()
    .min(3, 'Slug deve ter no mínimo 3 caracteres')
    .max(200, 'Slug muito longo')
    .toLowerCase()
    .trim()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug deve conter apenas letras minúsculas, números e hífens'
    )
    .refine(
      (slug) => !slug.startsWith('-') && !slug.endsWith('-'),
      { message: 'Slug não pode começar ou terminar com hífen' }
    )
    .refine(
      (slug) => !slug.includes('--'),
      { message: 'Slug não pode ter hífens duplos' }
    )
    .refine(
      (slug) => {
        // Validar que tem palavras reais (não só números)
        const hasLetters = /[a-z]/.test(slug);
        return hasLetters;
      },
      { message: 'Slug deve conter pelo menos algumas letras' }
    )
    .refine(
      (slug) => {
        // Slug deve ter pelo menos 2 partes (palavras)
        const parts = slug.split('-').filter(Boolean);
        return parts.length >= 2;
      },
      { message: 'Slug deve ter pelo menos 2 palavras separadas por hífen' }
    ),

  // Conteúdo Tiptap com validações profundas
  content: z
    .any()
    .refine(
      (val) => val !== null && val !== undefined,
      { message: 'Conteúdo é obrigatório' }
    )
    .refine(
      (val) => validateTiptapStructure(val),
      { 
        message: 'Conteúdo deve ser um JSON válido do Tiptap com pelo menos um parágrafo de texto'
      }
    )
    .refine(
      (val) => {
        // Validar tamanho mínimo de conteúdo
        const wordCount = countWords(val);
        return wordCount >= 50;
      },
      { message: 'Conteúdo deve ter pelo menos 50 palavras' }
    )
    .refine(
      (val) => {
        // Validar tamanho máximo de conteúdo
        const wordCount = countWords(val);
        return wordCount <= 10000;
      },
      { message: 'Conteúdo muito longo (máximo 10.000 palavras)' }
    )
    .refine(
      (val) => {
        // Validar que não é só espaços
        const json = JSON.stringify(val);
        return json.replace(/\s/g, '').length > 100;
      },
      { message: 'Conteúdo parece vazio ou inválido' }
    ),

  // Subcategoria obrigatória (MongoDB ObjectId)
  // Cada post deve pertencer a uma subcategoria (que por sua vez pertence a uma categoria)
  subcategoryId: z.string().min(1, 'Subcategoria é obrigatória'),

  // Autor obrigatório
  authorId: z.string().min(1, 'ID do autor é obrigatório'),

  // Status com validação
  status: z
    .enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED', 'TRASH'])
    .optional()
    .default('DRAFT'),

  // Featured flag
  featured: z.boolean().optional().default(false),

  // Permitir comentários
  allowComments: z.boolean().optional().default(true),

  // Post fixado
  pinned: z.boolean().optional().default(false),

  // Prioridade
  priority: z
    .number()
    .int('Prioridade deve ser um número inteiro')
    .min(0, 'Prioridade mínima é 0')
    .max(100, 'Prioridade máxima é 100')
    .optional()
    .default(0),

  // Data de publicação
  publishedAt: z
    .string()
    .datetime('Data de publicação inválida')
    .refine(
      (date) => {
        // Não permitir datas muito no futuro (mais de 1 ano)
        const publishDate = new Date(date);
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 1);
        return publishDate <= maxDate;
      },
      { message: 'Data de publicação não pode ser mais de 1 ano no futuro' }
    )
    .optional()
    .nullable(),
});

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DE CRIAÇÃO DE POST (COM VALIDAÇÕES CRUZADAS)
// ═══════════════════════════════════════════════════════════════════════════
export const createPostSchema = postSchemaBase
  .refine(
    (data) => {
      // Validação cruzada: se status é PUBLISHED, deve ter publishedAt
      if (data.status === 'PUBLISHED' && !data.publishedAt) {
        return false;
      }
      return true;
    },
    {
      message: 'Posts publicados devem ter data de publicação',
      path: ['publishedAt']
    }
  )
  .refine(
    (data) => {
      // Validação cruzada: título e slug devem ser relacionados
      const titleWords = data.title.toLowerCase().split(/\s+/);
      const slugWords = data.slug.split('-');
      
      // Pelo menos 1 palavra em comum
      const hasCommonWord = titleWords.some(word => 
        slugWords.some(slugWord => slugWord.includes(word) || word.includes(slugWord))
      );
      
      return hasCommonWord;
    },
    {
      message: 'Slug deve estar relacionado ao título',
      path: ['slug']
    }
  );

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DE ATUALIZAÇÃO COMPLETA (MELHORADO)
// ═══════════════════════════════════════════════════════════════════════════
export const updatePostSchema = postSchemaBase
  .partial()
  .omit({ authorId: true }); // Não permitir mudar autor

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA SIMPLIFICADO PARA UPDATE POR SLUG (MELHORADO)
// ═══════════════════════════════════════════════════════════════════════════
export const updatePostBySlugSchema = z.object({
  title: postSchemaBase.shape.title,
  content: postSchemaBase.shape.content,
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS DE PARÂMETROS
// ═══════════════════════════════════════════════════════════════════════════
export const getPostByIdSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
});

export const getPostBySlugSchema = z.object({
  slug: z.string().min(1, 'Slug é obrigatório').toLowerCase().trim(),
});

export const listPostsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().min(1).max(100).optional().default(10),
  published: z.coerce.boolean().optional(),
  tag: z.string().min(1).max(50).optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS TYPESCRIPT INFERIDOS
// ═══════════════════════════════════════════════════════════════════════════
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type UpdatePostBySlugInput = z.infer<typeof updatePostBySlugSchema>;
export type GetPostByIdInput = z.infer<typeof getPostByIdSchema>;
export type GetPostBySlugInput = z.infer<typeof getPostBySlugSchema>;
export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;

