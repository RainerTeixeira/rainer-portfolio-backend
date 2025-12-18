/**
 * @fileoverview DTOs de Autenticação
 * 
 * Data Transfer Objects para todas as operações de autenticação.
 * Define a estrutura dos dados enviados e recebidos nas APIs de auth.
 * 
 * @module auth/dto/auth.dto
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

/**
 * DTO para Login de Usuário.
 * 
 * Contém as credenciais necessárias para autenticar um usuário
 * no sistema através do endpoint de login.
 * 
 * @interface LoginDto
 * 
 * @example
 * ```typescript
 * const loginData: LoginDto = {
 *   email: 'usuario@exemplo.com',
 *   password: 'senha123'
 * };
 * ```
 * 
 * @since 1.0.0
 */
export interface LoginDto {
  /** Email do usuário cadastrado no sistema */
  email: string;
  /** Senha do usuário (mínimo 8 caracteres) */
  password: string;
}

/**
 * DTO para Registro de Novo Usuário.
 * 
 * Contém todos os dados necessários para criar uma nova conta
 * de usuário no sistema.
 * 
 * @interface SignupDto
 * 
 * @example
 * ```typescript
 * const signupData: SignupDto = {
 *   email: 'novo@exemplo.com',
 *   password: 'SenhaForte123',
 *   fullName: 'Novo Usuário',
 *   nickname: 'novousuario'
 * };
 * ```
 * 
 * @since 1.0.0
 */
export interface SignupDto {
  /** Email único para o novo usuário */
  email: string;
  /** Senha forte (mínimo 8 caracteres, 1 letra maiúscula, 1 número) */
  password: string;
  /** Nome completo do usuário */
  fullName: string;
  /** Nickname único (opcional, gerado automaticamente se não informado) */
  nickname?: string;
}

/**
 * DTO para Refresh de Token.
 * 
 * Utilizado para renovar o token de acesso sem que o usuário
 * precise fazer login novamente.
 * 
 * @interface RefreshTokenDto
 * 
 * @example
 * ```typescript
 * const refreshData: RefreshTokenDto = {
 *   refreshToken: 'eyJhbGciOiJIUzI1NiIs...'
 * };
 * ```
 * 
 * @since 1.0.0
 */
export interface RefreshTokenDto {
  /** Token refresh obtido no login (válido por 30 dias) */
  refreshToken: string;
}

/**
 * DTO para Confirmação de Email.
 * 
 * Utilizado para confirmar o endereço de email após o registro,
 * usando o código enviado por email.
 * 
 * @interface ConfirmEmailDto
 * 
 * @example
 * ```typescript
 * const confirmData: ConfirmEmailDto = {
 *   token: '123456'
 * };
 * ```
 * 
 * @since 1.0.0
 */
export interface ConfirmEmailDto {
  /** Código de confirmação de 6 dígitos enviado por email */
  token: string;
}

/**
 * DTO para Solicitação de Recuperação de Senha.
 * 
 * Inicia o processo de recuperação enviando um código
 * de reset para o email do usuário.
 * 
 * @interface ForgotPasswordDto
 * 
 * @example
 * ```typescript
 * const forgotData: ForgotPasswordDto = {
 *   email: 'usuario@exemplo.com'
 * };
 * ```
 * 
 * @since 1.0.0
 */
export interface ForgotPasswordDto {
  /** Email do usuário que deseja recuperar a senha */
  email: string;
}

/**
 * DTO para Redefinição de Senha.
 * 
 * Utilizado para definir uma nova senha usando o código
 * de confirmação recebido por email.
 * 
 * @interface ResetPasswordDto
 * 
 * @example
 * ```typescript
 * const resetData: ResetPasswordDto = {
 *   token: '123456',
 *   newPassword: 'NovaSenha123'
 * };
 * ```
 * 
 * @since 1.0.0
 */
export interface ResetPasswordDto {
  /** Código de confirmação recebido por email */
  token: string;
  /** Nova senha forte (mínimo 8 caracteres) */
  newPassword: string;
}
