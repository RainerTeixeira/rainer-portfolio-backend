/**
 * Schemas de Validação para Autenticação
 * 
 * Define schemas Zod para validação de dados de autenticação.
 * 
 * @module schemas/auth
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS DE ENTRADA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Schema para login
 */
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

/**
 * Schema para registro
 */
export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais'
    ),
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  username: z.string().min(3, 'Username deve ter no mínimo 3 caracteres'),  // Obrigatório
  phoneNumber: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Telefone deve estar no formato internacional (+5511999999999)')
    .optional(),
  avatar: z.string().url('Avatar deve ser uma URL válida').optional(),
});

/**
 * Schema para refresh token
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

/**
 * Schema para confirmação de email
 */
export const confirmEmailSchema = z.object({
  email: z.string().email('Email inválido'),
  code: z.string().min(1, 'Código é obrigatório'),
});

/**
 * Schema para esqueci minha senha
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

/**
 * Schema para redefinir senha
 */
export const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
  code: z.string().min(1, 'Código é obrigatório'),
  newPassword: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais'
    ),
});

// ═══════════════════════════════════════════════════════════════════════════
// TYPES INFERIDOS
// ═══════════════════════════════════════════════════════════════════════════

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ConfirmEmailInput = z.infer<typeof confirmEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

