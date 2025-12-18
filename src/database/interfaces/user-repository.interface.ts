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
  /** ID único do usuário (UUID) */
  id: string;
  /** Sub do AWS Cognito (identificador único no Cognito) */
  cognitoSub: string;
  /** Nome de exibição (pode ser diferente do fullName) */
  name: string;
  /** Nome completo do usuário */
  fullName: string;
  /** Username único (opcional, usado para login alternativo) */
  username?: string;
  /** Email do usuário (único no sistema) */
  email: string;
  /** Hash da senha (armazenado com bcrypt) */
  passwordHash: string;
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
  /** Contador de curtidas recebidas */
  likesCount: number;
  /** Contador de seguidores */
  followersCount: number;
  /** Contador de usuários seguidos */
  followingCount: number;
  /** Data de criação do usuário */
  createdAt: Date;
  /** Data da última atualização */
  updatedAt: Date;
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
   * Busca usuário pelo ID.
   * 
   * @param {string} id - ID do usuário
   * @returns {Promise<User | null>} Usuário encontrado ou null
   */
  findById(id: string): Promise<User | null>;
  
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
   * @param {string} id - ID do usuário
   * @param {Partial<User>} data - Dados para atualizar
   * @returns {Promise<User | null>} Usuário atualizado ou null
   */
  update(id: string, data: Partial<User>): Promise<User | null>;
  
  /**
   * Exclui um usuário.
   * 
   * @param {string} id - ID do usuário
   * @returns {Promise<void>}
   */
  delete(id: string): Promise<void>;
  
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
