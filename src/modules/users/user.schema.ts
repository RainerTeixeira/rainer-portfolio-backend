/**
 * Schemas de Validação de Usuários (MELHORADO)
 * 
 * Versão aprimorada com:
 * - Refinements avançados para validações complexas
 * - Transformações automáticas de dados
 * - Validações customizadas
 * - Mensagens de erro mais descritivas
 * 
 * @fileoverview Schemas Zod melhorados para validação de usuários
 * @module schemas/users
 * @version 2.0.0
 * @since 1.0.0
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// VALIDADORES CUSTOMIZADOS
// ═══════════════════════════════════════════════════════════════════════════



// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA BASE DE USUÁRIO (APENAS DADOS COMPLEMENTARES)
// ═══════════════════════════════════════════════════════════════════════════
// NOTA: email, username e password são gerenciados pelo Cognito
const userSchemaBase = z.object({
  // CognitoSub (identificador único)
  cognitoSub: z
    .string()
    .min(1, 'CognitoSub é obrigatório')
    .uuid('CognitoSub deve ser um UUID válido'),

  // Nome com limpeza automática
  fullName: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome muito longo')
    .trim() // Transform: remover espaços
    .transform((fullName) => {
      // Transform: capitalizar cada palavra
      return fullName.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    })
    .refine(
      (fullName) => /^[a-zA-ZÀ-ÿ\s'-]+$/.test(fullName),
      { message: 'Nome deve conter apenas letras, espaços, hífens e apóstrofos' }
    )
    .refine(
      (fullName) => fullName.split(' ').length >= 2,
      { message: 'Por favor, forneça nome e sobrenome' }
    ),

  // Avatar com validação de URL
  avatar: z
    .string()
    .url('URL do avatar inválida')
    .refine(
      (url) => {
        // Validar extensão de imagem
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        return validExtensions.some(ext => url.toLowerCase().endsWith(ext));
      },
      { message: 'Avatar deve ser uma imagem válida (jpg, png, gif, webp, svg)' }
    )
    .refine(
      (url) => {
        // Validar tamanho da URL
        return url.length <= 500;
      },
      { message: 'URL do avatar muito longa' }
    )
    .optional()
    .nullable(),

  // Bio com limpeza e validação
  bio: z
    .string()
    .max(500, 'Bio muito longa')
    .trim()
    .refine(
      (bio) => {
        // Não permitir apenas espaços ou quebras de linha
        return bio.replace(/\s/g, '').length > 0;
      },
      { message: 'Bio não pode ser vazia' }
    )
    .optional()
    .nullable(),

  // Website com validação completa
  website: z
    .string()
    .url('URL do website inválida')
    .refine(
      (url) => {
        // Validar protocolo HTTPS
        return url.startsWith('https://');
      },
      { message: 'Website deve usar HTTPS' }
    )
    .optional()
    .nullable(),

  // Social links com validação por plataforma
  socialLinks: z
    .record(
      z.string().refine(
        (url) => {
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        },
        { message: 'Link de rede social inválido' }
      )
    )
    .optional()
    .nullable(),

  // Role com valores permitidos
  role: z.enum(['ADMIN', 'EDITOR', 'AUTHOR', 'SUBSCRIBER']).optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DE CRIAÇÃO DE USUÁRIO
// ═══════════════════════════════════════════════════════════════════════════
export const createUserSchema = userSchemaBase;

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DE ATUALIZAÇÃO
// ═══════════════════════════════════════════════════════════════════════════
export const updateUserSchema = userSchemaBase
  .partial() // Todos os campos opcionais
  .omit({ cognitoSub: true }); // CognitoSub não pode ser alterado

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA PARA BUSCA POR COGNITO SUB
// ═══════════════════════════════════════════════════════════════════════════
export const getUserByCognitoSubSchema = z.object({
  cognitoSub: z.string().min(1, 'CognitoSub é obrigatório').uuid('CognitoSub deve ser um UUID válido'),
});

export const getUserByIdSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
});

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS TYPESCRIPT INFERIDOS
// ═══════════════════════════════════════════════════════════════════════════
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>;
export type GetUserByCognitoSubInput = z.infer<typeof getUserByCognitoSubSchema>;

