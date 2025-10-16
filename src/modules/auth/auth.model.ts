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
  name?: string;
  username?: string;
  emailVerified: boolean;
  groups: string[];
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  username: string;  // Obrigatório para criar no MongoDB
  phoneNumber?: string;
  avatar?: string;   // Opcional
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  email: string;
  name?: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  name: string;
  emailVerificationRequired: boolean;
  message: string;
}

export interface RefreshTokenData {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface ConfirmEmailData {
  email: string;
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

