/**
 * Modelo de Autenticação
 *
 * Define a estrutura de dados para autenticação de usuários.
 * Integração com AWS Cognito.
 *
 * @module modules/auth/auth.model
 */

export interface User {
  id: string;
  email: string;
  fullName?: string;
  username?: string;
  emailVerified: boolean;
  groups: string[];
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string; // Email do usuário (usado como username no Cognito)
  password: string; // Senha do usuário
  fullName: string; // Nome completo do usuário
  nickname?: string; // Nickname do usuário (apenas letras e números) - opcional
  username?: string; // Mantido para compatibilidade (pode ser removido no futuro)
  phoneNumber?: string; // Número de telefone (opcional)
  avatar?: string; // URL do avatar (opcional)
}

export interface LoginResponseTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface LoginResponseUser {
  id: string;
  cognitoSub: string;
  fullName: string;
  email: string;
  avatar?: string;
  bio?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  postsCount: number;
  commentsCount: number;
  needsNickname?: boolean; // Flag indicando se precisa escolher nickname (OAuth)
}

export interface LoginResponse {
  tokens: LoginResponseTokens;
  user: LoginResponseUser;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  fullName: string;
  username?: string; // Username gerado pelo backend (necessário para confirmação)
  emailVerificationRequired: boolean;
  message: string;
}

export interface RefreshTokenData {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface ConfirmEmailData {
  email: string;
  username: string; // Necessário para confirmar no Cognito
  code: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  code: string;
  newPassword: string;
}

/**
 * Dados para iniciar autenticação passwordless
 */
export interface PasswordlessLoginInitData {
  email: string;
}

/**
 * Resposta ao iniciar autenticação passwordless
 */
export interface PasswordlessLoginInitResponse {
  success: boolean;
  message: string;
  session?: string; // Session ID para verificação posterior
}

/**
 * Dados para verificar código de autenticação passwordless
 */
export interface PasswordlessLoginVerifyData {
  email: string;
  code: string;
  session?: string; // Session ID recebido na inicialização
}

/**
 * Resposta da verificação passwordless (mesma estrutura do login normal)
 */
export type PasswordlessLoginVerifyResponse = LoginResponse;
