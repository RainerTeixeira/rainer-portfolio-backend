/**
 * @fileoverview Serviço de Usuários
 * 
 * Serviço responsável por gerenciar todas as operações relacionadas
 * aos usuários do sistema, incluindo criação, busca, atualização e exclusão.
 * 
 * @module modules/users/services/users.service
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../database/tokens';
import { UserRepository, User } from '../../../database/interfaces/user-repository.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { randomUUID } from 'crypto';

/**
 * Serviço de gerenciamento de usuários.
 * 
 * Responsável por:
 * - Criar novos usuários
 * - Buscar usuários por ID, email ou Cognito Sub
 * - Atualizar dados do usuário
 * - Gerenciar perfis e permissões
 * - Listar usuários com paginação
 * 
 * @class UsersService
 * 
 * @example
 * ```typescript
 * // Criar novo usuário
 * const user = await usersService.createUser({
 *   name: 'João Silva',
 *   email: 'joao@example.com',
 *   password: 'senha123'
 * });
 * ```
 * 
 * @since 1.0.0
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  /**
   * Cria uma instância do UsersService.
   * 
   * @constructor
   * @param {UserRepository} usersRepo - Repositório de usuários injetado
   */
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly usersRepo: UserRepository,
  ) {}

  /**
   * Cria um novo usuário no sistema.
   *
   * Por que isso fica no service:
   * - O controller não deve decidir defaults de domínio nem gerar IDs.
   * - O repositório não deve conter regras de negócio; ele apenas persiste/consulta.
   * - O service centraliza decisões simples (id/defaults) para manter consistência.
   *
   * @async
   * @method createUser
   * @param {CreateUserDto} dto - Dados do novo usuário
   * @returns {Promise<User>} Usuário criado
   * 
   * @example
   * ```typescript
   * const user = await usersService.createUser({
   *   name: 'Maria Silva',
   *   email: 'maria@example.com',
   *   password: 'SenhaForte123'
   * });
   * ```
   */
  async createUser(dto: CreateUserDto): Promise<User> {
    const cognitoSub = dto.cognitoSub || randomUUID();

    return this.usersRepo.create({
      cognitoSub,
      fullName: dto.fullName || dto.name || '',
      nickname: dto.nickname || dto.fullName || dto.name || '',
      role: 'SUBSCRIBER',
      isActive: true,
      isBanned: false,
      postsCount: 0,
      commentsCount: 0,
      bio: dto.bio,
      website: dto.website,
      socialLinks: dto.socialLinks,
      avatar: dto.avatar,
    });
  }

  /**
   * Busca usuário pelo ID.
   * 
   * @async
   * @method getUserById
   * @param {string} id - ID do usuário
   * @returns {Promise<User | null>} Usuário encontrado ou null
   */
  async getUserById(id: string): Promise<User | null> {
    return this.usersRepo.findById(id);
  }

  /**
   * Lista todos os usuários do sistema.
   * 
   * @async
   * @method findAll
   * @param {object} [options] - Opções de busca
   * @returns {Promise<User[]>} Lista de usuários
   * 
   * @todo Implementar paginação e filtros
   */
  async findAll(_options?: {
    limit?: number;
    offset?: number;
    _excludeCognitoSub?: boolean;
  }): Promise<User[]> {
    const users = await this.usersRepo.findAll();
    console.log('UsersService.findAll - users found:', users.length);
    return users;
  }

  /**
   * Busca perfil completo do usuário.
   * 
   * @async
   * @method findProfile
   * @param {string} userId - ID do usuário
   * @param {object} [options] - Opções de busca
   * @returns {Promise<User | null>} Perfil do usuário
   */
  async findProfile(
    userId: string,
    _options?: {
      _fullName?: boolean;
      _nickname?: boolean;
      _excludeCognitoSub?: boolean;
    }
  ): Promise<User | null> {
    return this.usersRepo.findById(userId);
  }

  /**
   * Busca usuário pelo Cognito Sub.
   * 
   * @async
   * @method getUserByCognitoSub
   * @param {string} cognitoSub - Sub do Cognito
   * @returns {Promise<User | null>} Usuário encontrado
   */
  async getUserByCognitoSub(cognitoSub: string): Promise<User | null> {
    return this.usersRepo.findByCognitoSub(cognitoSub);
  }

  /**
   * Atualiza dados de um usuário.
   * 
   * @async
   * @method updateUser
   * @param {string} id - ID do usuário
   * @param {Partial<User>} data - Dados para atualizar
   * @returns {Promise<User>} Usuário atualizado
   * @throws {Error} Usuário não encontrado
   */
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const updatedUser = await this.usersRepo.update(id, data);
    if (!updatedUser) {
      throw new Error('User not found');
    }
    return updatedUser;
  }

  /**
   * Exclui um usuário do sistema.
   * 
   * @async
   * @method deleteUser
   * @param {string} id - ID do usuário
   * @returns {Promise<void>}
   */
  async deleteUser(id: string): Promise<void> {
    await this.usersRepo.delete(id);
  }

  /**
   * Busca usuário por email.
   * 
   * @async
   * @method findByEmail
   * @param {string} email - Email do usuário
   * @returns {Promise<User | null>} Usuário encontrado
   * 
   * @todo Implementar busca usando GSI1 para performance
   */
  async findByEmail(email: string): Promise<User | null> {
    // Implementação simplificada - em produção usaria GSI1
    const users = await this.usersRepo.findAll();
    return users.find(u => u.email === email) || null;
  }

  /**
   * Verifica disponibilidade de nickname.
   * 
   * @async
   * @method checkNicknameAvailability
   * @param {string} _nickname - Nickname para verificar
   * @param {string} [_excludeCognitoSub] - Excluir usuário da verificação
   * @returns {Promise<boolean>} True se disponível
   * 
   * @todo Implementar verificação real no banco
   */
  async checkNicknameAvailability(_nickname: string, _excludeCognitoSub?: string): Promise<boolean> {
    // Implementação simplificada - em produção faria uma consulta real
    return true;
  }

  /**
   * Atualiza nickname do usuário.
   * 
   * @async
   * @method updateUserNickname
   * @param {string} cognitoSub - Sub do Cognito
   * @param {string} newNickname - Novo nickname
   * @returns {Promise<void>}
   * @throws {Error} Usuário não encontrado
   */
  async updateUserNickname(cognitoSub: string, newNickname: string): Promise<void> {
    const user = await this.usersRepo.findByCognitoSub(cognitoSub);
    if (!user) {
      throw new Error('User not found');
    }
    if (!newNickname) {
      throw new Error('Nickname is required');
    }
    
    const userId = user.id ?? user.cognitoSub;
    if (!userId) {
      throw new Error('User id is required to update nickname');
    }

    await this.usersRepo.update(userId, { nickname: newNickname as string });
  }

  /**
   * Verifica se nome de usuário já está em uso.
   * 
   * @async
   * @method isNameTaken
   * @param {string} name - Nome para verificar
   * @returns {Promise<boolean>} True se já em uso
   */
  async isNameTaken(name: string): Promise<boolean> {
    const user = await this.usersRepo.findByUsername(name);
    return !!user;
  }

  /**
   * Lista usuários com paginação e filtros.
   * 
   * @async
   * @method listUsers
   * @param {object} [options={}] - Opções de listagem
   * @param {number} [options.page=1] - Página atual
   * @param {number} [options.limit=10] - Itens por página
   * @param {string} [options.role] - Filtrar por papel
   * @param {string} [options.search] - Busca textual
   * @returns {Promise<object>} Lista paginada
   * 
   * @todo Implementar busca textual no banco
   * @todo Implementar paginação no banco
   */
  async listUsers(options: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  } = {}) {
    const { page = 1, limit = 10, role, search } = options;
    const offset = (page - 1) * limit;

    const users = await this.usersRepo.findAll();
    console.log('UsersService.listUsers - users found:', users.length);

    // TODO: Implementar paginação e filtro no futuro
    // Por enquanto, retorna todos os usuários
    const filteredUsers = role 
      ? users.filter(u => u.role === role)
      : users;

    // TODO: Implementar busca por texto no futuro
    if (search) {
      this.logger.warn('Search functionality not yet implemented');
    }

    // Aplicar paginação manual
    const startIndex = offset;
    const endIndex = offset + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return {
      users: paginatedUsers,
      page,
      limit,
      total: filteredUsers.length,
    };
  }
}
