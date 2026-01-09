/**
 * @fileoverview Interfaces do Repositório de Usuários
 * 
 * Define o contrato (interface) para o repositório de usuários
 * e a estrutura da entidade User utilizada em toda a aplicação.
 * 
 * @module database/interfaces/user-repository.interface
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

/**
 * Entidade Usuário do sistema.
 * 
 * Representa um usuário completo com todas as informações
 * necessárias para o funcionamento da aplicação.
 * 
 * @interface User
 * 
 * @example
 * ```typescript
 * const user: User = {
 *   id: 'uuid',
 *   cognitoSub: 'cognito-sub',
 *   fullName: 'João Silva',
 *   email: 'joao@example.com',
 *   role: 'AUTHOR',
 *   isActive: true,
 *   isBanned: false,
 *   // ... outros campos
 * };
 * ```
 * 
 * @since 1.0.0
 */
export interface User {
  /** Sub do AWS Cognito (identificador único no Cognito) - Primary Key */
  cognitoSub: string;
  /** Nome completo do usuário */
  fullName: string;
  /** Nickname único (usado em URLs e menções) */
  nickname?: string;
  /** URL do avatar do usuário */
  avatar?: string;
  /** Biografia/descrição do perfil */
  bio?: string;
  /** Website pessoal do usuário */
  website?: string;
  /** Links para redes sociais */
  socialLinks?: Record<string, string>;
  /** Papel/permissão do usuário no sistema */
  role: string;
  /** Indica se o usuário está ativo */
  isActive: boolean;
  /** Indica se o usuário está banido */
  isBanned: boolean;
  /** Contador de posts publicados */
  postsCount: number;
  /** Contador de comentários feitos */
  commentsCount: number;
  /** Data de criação do usuário */
  createdAt: Date;
  /** Data da última atualização */
  updatedAt: Date;
  
  // Campos opcionais para compatibilidade
  /** Nome de exibição - Para compatibilidade */
  name?: string;
  /** Username único - Para compatibilidade */
  username?: string;
  /** Email do usuário - Vem do Cognito JWT */
  email?: string;
  /** Hash da senha - Gerenciado pelo Cognito */
  passwordHash?: string;
  /** Contador de curtidas recebidas - Para compatibilidade */
  likesCount?: number;
  /** Contador de seguidores - Para compatibilidade */
  followersCount?: number;
  /** Contador de usuários seguidos - Para compatibilidade */
  followingCount?: number;
}

/**
 * Interface do Repositório de Usuários.
 * 
 * Define o contrato que toda implementação de repositório
 * de usuários deve seguir (MongoDB, DynamoDB, etc.).
 * 
 * @interface UserRepository
 * 
 * @example
 * ```typescript
 * class MongoUserRepository implements UserRepository {
 *   async create(data: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
 *     // Implementação MongoDB
 *   }
 *   // ... outros métodos
 * }
 * ```
 * 
 * @since 1.0.0
 */
export interface UserRepository {
  /**
   * Cria um novo usuário.
   * 
   * @param {Omit<User, 'createdAt' | 'updatedAt'>} data - Dados do usuário
   * @returns {Promise<User>} Usuário criado
   */
  create(data: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User>;
  
  /**
   * Busca usuário pelo Cognito Sub.
   * 
   * @param {string} cognitoSub - Sub do Cognito
   * @returns {Promise<User | null>} Usuário encontrado ou null
   */
  findByCognitoSub(cognitoSub: string): Promise<User | null>;
  
  /**
   * Busca usuário pelo email.
   * 
   * @param {string} email - Email do usuário
   * @returns {Promise<User | null>} Usuário encontrado ou null
   */
  findByEmail(email: string): Promise<User | null>;
  
  /**
   * Busca usuário pelo username.
   * 
   * @param {string} username - Username do usuário
   * @returns {Promise<User | null>} Usuário encontrado ou null
   */
  findByUsername(username: string): Promise<User | null>;
  
  /**
   * Lista todos os usuários.
   * 
   * @returns {Promise<User[]>} Lista de usuários
   */
  findAll(): Promise<User[]>;
  
  /**
   * Atualiza dados de um usuário.
   * 
   * @param {string} cognitoSub - Sub do Cognito do usuário
   * @param {Partial<User>} data - Dados para atualizar
   * @returns {Promise<User | null>} Usuário atualizado ou null
   */
  update(cognitoSub: string, data: Partial<User>): Promise<User | null>;
  
  /**
   * Exclui um usuário.
   * 
   * @param {string} cognitoSub - Sub do Cognito do usuário
   * @returns {Promise<void>}
   */
  delete(cognitoSub: string): Promise<void>;
  
  /**
   * Verifica se nome completo já está em uso.
   * 
   * @param {string} fullName - Nome para verificar
   * @returns {Promise<boolean>} True se já em uso
   */
  isNameTaken(fullName: string): Promise<boolean>;
  
  /**
   * Verifica disponibilidade de nickname.
   * 
   * @param {string} nickname - Nickname para verificar
   * @param {string} [excludeCognitoSub] - Excluir usuário da verificação
   * @returns {Promise<boolean>} True se disponível
   */
  checkNicknameAvailability(nickname: string, excludeCognitoSub?: string): Promise<boolean>;
  
  /**
   * Atualiza nickname do usuário.
   * 
   * @param {string} cognitoSub - Sub do Cognito
   * @param {string} newNickname - Novo nickname
   * @returns {Promise<void>}
   */
  updateUserNickname(cognitoSub: string, newNickname: string): Promise<void>;
}

/**
 * Token de injeção do repositório de usuários.
 * 
 * Utilizado pelo NestJS para injetar a implementação correta
 * do repositório nos serviços.
 * 
 * @constant {string}
 * 
 * @since 1.0.0
 */
export const USER_REPOSITORY = 'USER_REPOSITORY';
