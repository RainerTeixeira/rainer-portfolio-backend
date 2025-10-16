/**
 * User Model
 * 
 * Modelo de dados para usuários com integração Amazon Cognito.
 * 
 * Divisão de Responsabilidades:
 * - Cognito: Gerencia credenciais, senha, MFA, verificação de email
 * - MongoDB: Armazena perfil complementar, dados de domínio, estatísticas
 * 
 * @module modules/users/user.model
 */

/**
 * Enum de papéis de usuário (gerenciado pela aplicação)
 * Sincronizado com Prisma schema
 */
export enum UserRole {
  ADMIN = 'ADMIN',       // Administrador total do sistema
  EDITOR = 'EDITOR',     // Editor de conteúdo (aprova posts)
  AUTHOR = 'AUTHOR',     // Autor de posts (cria conteúdo)
  SUBSCRIBER = 'SUBSCRIBER', // Assinante (apenas lê e comenta)
}

/**
 * Interface completa do User
 * 
 * IMPORTANTE: Campos de autenticação (password, isVerified, lastLogin)
 * foram REMOVIDOS pois são gerenciados pelo Amazon Cognito
 */
export interface User {
  /** ID interno do MongoDB (ObjectId) */
  id: string;

  /** 
   * ID único do usuário no Amazon Cognito (sub claim do JWT)
   * Este é o identificador global que conecta Cognito ⇄ MongoDB
   * Formato: UUID v4 (ex: "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
   */
  cognitoSub: string;

  /** Email do usuário (sincronizado do Cognito) */
  email: string;

  /** Nome de usuário único (@username) */
  username: string;

  /** Nome completo ou nome de exibição (sincronizado do Cognito) */
  name: string;

  /** URL do avatar (CDN, S3, ou caminho local) */
  avatar?: string;

  /** Biografia curta do usuário (recomendado: max 500 caracteres) */
  bio?: string;

  /** Website pessoal, portfólio ou blog */
  website?: string;

  /** 
   * Links de redes sociais em formato JSON
   * Formato: { twitter: "url", github: "url", linkedin: "url" }
   */
  socialLinks?: Record<string, string>;

  /** 
   * Papel do usuário na aplicação (define permissões internas)
   * ADMIN: acesso total | EDITOR: aprova posts | AUTHOR: cria posts | SUBSCRIBER: lê
   */
  role: UserRole;

  /** Usuário ativo no sistema (false = desativado pelo admin) */
  isActive: boolean;

  /** Usuário banido (moderação interna da aplicação) */
  isBanned: boolean;

  /** Motivo do banimento interno (se aplicável) */
  banReason?: string;

  /** Contador de posts criados (calculado) */
  postsCount: number;

  /** Contador de comentários feitos (calculado) */
  commentsCount: number;

  /** Data de criação do perfil na aplicação */
  createdAt: Date;

  /** Última atualização do perfil */
  updatedAt: Date;
}

/**
 * DTO para criação de usuário
 * 
 * Usado quando:
 * - Usuário se registra via Cognito (Lambda Post-Confirmation Trigger)
 * - Admin cria usuário manualmente via painel
 */
export interface CreateUserData {
  /** ID único do Cognito (sub claim) - OBRIGATÓRIO */
  cognitoSub: string;

  /** Email (sincronizado do Cognito) - OBRIGATÓRIO */
  email: string;

  /** Username único - OBRIGATÓRIO */
  username: string;

  /** Nome completo - OBRIGATÓRIO */
  name: string;

  /** Avatar (opcional) */
  avatar?: string;

  /** Bio (opcional) */
  bio?: string;

  /** Website (opcional) */
  website?: string;

  /** Links sociais (opcional) */
  socialLinks?: Record<string, string>;

  /** Role (opcional, padrão: AUTHOR) */
  role?: UserRole;
}

/**
 * DTO para atualização de usuário
 * Todos os campos são opcionais
 * 
 * NOTA: Email e username podem ser atualizados aqui,
 * mas devem ser sincronizados com Cognito via API
 */
export interface UpdateUserData {
  /** Email (sincronizar com Cognito) */
  email?: string;

  /** Username */
  username?: string;

  /** Nome completo */
  name?: string;

  /** Avatar */
  avatar?: string;

  /** Bio */
  bio?: string;

  /** Website */
  website?: string;

  /** Links sociais */
  socialLinks?: Record<string, string>;

  /** Role (apenas ADMIN pode alterar) */
  role?: UserRole;

  /** Status ativo (apenas ADMIN pode alterar) */
  isActive?: boolean;

  /** Status banido (apenas ADMIN pode alterar) */
  isBanned?: boolean;

  /** Motivo do banimento */
  banReason?: string;
}

/**
 * User com relações populadas (para retorno de API)
 */
export interface UserWithStats extends User {
  /** Estatísticas detalhadas */
  stats?: {
    postsCount: number;
    commentsCount: number;
    likesGiven: number;
    bookmarksCount: number;
  };
}

/**
 * Payload do token Cognito (JWT claims)
 * Usado para validação e sincronização
 */
export interface CognitoTokenPayload {
  /** Sub (ID único do usuário no Cognito) */
  sub: string;

  /** Email verificado */
  email: string;

  /** Email verificado */
  email_verified: boolean;

  /** Nome */
  name?: string;

  /** Username (custom attribute) */
  'cognito:username'?: string;

  /** Groups do Cognito (opcional) */
  'cognito:groups'?: string[];
}

/**
 * DTO para sincronização de perfil Cognito → MongoDB
 * Usado em Lambda Post-Confirmation ou ao fazer login
 */
export interface SyncCognitoUserData {
  /** Sub do Cognito */
  cognitoSub: string;

  /** Email do Cognito */
  email: string;

  /** Nome do Cognito */
  name: string;

  /** Username (derivado do email ou custom attribute) */
  username?: string;
}
