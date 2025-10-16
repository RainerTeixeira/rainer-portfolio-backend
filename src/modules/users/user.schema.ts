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

/**
 * Lista de senhas comuns que devem ser rejeitadas
 */
const COMMON_PASSWORDS = [
  'password', 'Password123', '12345678', 'qwerty123', 'admin123',
  'letmein', 'welcome123', 'monkey123', '1234567890'
];

/**
 * Lista de domínios de email temporários bloqueados
 */
const TEMP_EMAIL_DOMAINS = [
  'tempmail.com', 'guerrillamail.com', '10minutemail.com',
  'throwaway.email', 'mailinator.com'
];

/**
 * Lista de usernames reservados do sistema
 */
const RESERVED_USERNAMES = [
  'admin', 'administrator', 'root', 'system', 'api',
  'support', 'help', 'info', 'webmaster', 'moderator',
  'mod', 'owner', 'superuser', 'superadmin', 'test'
];

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA BASE DE USUÁRIO (SEM REFINES GLOBAIS)
// ═══════════════════════════════════════════════════════════════════════════
const userSchemaBase = z.object({
  // Email com validações avançadas
  email: z
    .string()
    .email('Email inválido')
    .toLowerCase() // Transform: converter para minúsculas
    .trim() // Transform: remover espaços
    .refine(
      (email) => {
        // Validar domínio não é de email temporário
        const domain = email.split('@')[1];
        return !TEMP_EMAIL_DOMAINS.includes(domain);
      },
      { message: 'Emails temporários não são permitidos' }
    )
    .refine(
      (email) => {
        // Validar formato profissional (sem números demais)
        const localPart = email.split('@')[0];
        const numberCount = (localPart.match(/\d/g) || []).length;
        return numberCount <= localPart.length * 0.5; // Max 50% números
      },
      { message: 'Email deve parecer profissional' }
    ),

  // Username com validações avançadas
  username: z
    .string()
    .min(3, 'Username deve ter no mínimo 3 caracteres')
    .max(30, 'Username deve ter no máximo 30 caracteres')
    .toLowerCase() // Transform: converter para minúsculas
    .trim() // Transform: remover espaços
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username deve conter apenas letras, números, underscore e hífen')
    .refine(
      (username) => !RESERVED_USERNAMES.includes(username.toLowerCase()),
      { message: 'Este username está reservado pelo sistema' }
    )
    .refine(
      (username) => {
        // Não permitir sequências repetitivas
        return !/(.)\1{3,}/.test(username); // Ex: 'aaaa', '1111'
      },
      { message: 'Username não pode ter caracteres repetidos demais' }
    )
    .refine(
      (username) => {
        // Deve começar com letra
        return /^[a-zA-Z]/.test(username);
      },
      { message: 'Username deve começar com uma letra' }
    ),

  // Senha com validações robustas
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(128, 'Senha deve ter no máximo 128 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial (!@#$%^&*)')
    .refine(
      (password) => !COMMON_PASSWORDS.includes(password),
      { message: 'Esta senha é muito comum. Escolha uma senha mais forte.' }
    )
    .refine(
      (password) => {
        // Não permitir sequências óbvias
        const sequences = ['123456', 'abcdef', 'qwerty', 'asdfgh'];
        return !sequences.some(seq => password.toLowerCase().includes(seq));
      },
      { message: 'Senha não pode conter sequências óbvias (123456, qwerty, etc)' }
    )
    .refine(
      (password) => {
        // Validar entropia mínima (diversidade de caracteres)
        const uniqueChars = new Set(password).size;
        return uniqueChars >= Math.min(password.length * 0.6, 8);
      },
      { message: 'Senha deve ter mais variedade de caracteres' }
    ),

  // Nome com limpeza automática
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome muito longo')
    .trim() // Transform: remover espaços
    .transform((name) => {
      // Transform: capitalizar cada palavra
      return name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    })
    .refine(
      (name) => /^[a-zA-ZÀ-ÿ\s'-]+$/.test(name),
      { message: 'Nome deve conter apenas letras, espaços, hífens e apóstrofos' }
    )
    .refine(
      (name) => name.split(' ').length >= 2,
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
// SCHEMA DE CRIAÇÃO DE USUÁRIO (COM VALIDAÇÕES CRUZADAS)
// ═══════════════════════════════════════════════════════════════════════════
export const createUserSchema = userSchemaBase.refine(
  (data) => {
    // Validação cruzada: email e username não podem ser muito similares
    const emailLocal = data.email.split('@')[0].toLowerCase();
    const username = data.username.toLowerCase();
    
    // Calcular similaridade simples
    const similarity = emailLocal === username ? 1 : 0;
    
    return similarity < 1; // Não podem ser idênticos
  },
  {
    message: 'Username não pode ser igual ao prefixo do email',
    path: ['username']
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DE ATUALIZAÇÃO (MELHORADO)
// ═══════════════════════════════════════════════════════════════════════════
export const updateUserSchema = userSchemaBase
  .partial() // Todos os campos opcionais
  .omit({ password: true }); // Remover password (use updatePasswordSchema)

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DE ATUALIZAÇÃO DE SENHA (MELHORADO)
// ═══════════════════════════════════════════════════════════════════════════
export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: userSchemaBase.shape.password,
})
.refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: 'Nova senha deve ser diferente da senha atual',
    path: ['newPassword']
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// OUTROS SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════
export const loginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const getUserByIdSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
});

export const getUserByUsernameSchema = z.object({
  username: z.string().min(1, 'Username é obrigatório').toLowerCase().trim(),
});

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS TYPESCRIPT INFERIDOS
// ═══════════════════════════════════════════════════════════════════════════
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>;
export type GetUserByUsernameInput = z.infer<typeof getUserByUsernameSchema>;

