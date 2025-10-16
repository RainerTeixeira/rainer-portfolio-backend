/**
 * Users Service
 * 
 * Camada de lógica de negócio para usuários.
 * Integrado com Amazon Cognito para autenticação.
 * 
 * @module modules/users/users.service
 */

import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { UsersRepository } from './users.repository.js';
import type { CreateUserData, UpdateUserData, CognitoTokenPayload } from './user.model.js';

/**
 * Serviço de Usuários
 * 
 * IMPORTANTE: Autenticação delegada ao Amazon Cognito.
 * Este serviço gerencia apenas o perfil complementar e dados de domínio.
 * 
 * Responsabilidades:
 * - Sincronizar usuários Cognito ⇄ MongoDB
 * - Gerenciar perfil complementar (bio, avatar, website)
 * - Gerenciar permissões internas (role, isActive, isBanned)
 * - Manter estatísticas (postsCount, commentsCount)
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  /**
   * Cria um novo usuário no MongoDB
   * 
   * Chamado por:
   * - Lambda Post-Confirmation Trigger do Cognito
   * - Admin criando usuário manualmente
   * 
   * @param data - Dados do usuário (deve incluir cognitoSub)
   * @returns Usuário criado
   * @throws ConflictException se email ou username já existir
   */
  async createUser(data: CreateUserData) {
    this.logger.log(`Creating user: ${data.email}`);

    // Verificar se email já existe
    const existingEmail = await this.usersRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictException('Email já está em uso');
    }

    // Verificar se username já existe
    const existingUsername = await this.usersRepository.findByUsername(data.username);
    if (existingUsername) {
      throw new ConflictException('Username já está em uso');
    }

    // Criar usuário
    return await this.usersRepository.create(data);
  }

  /**
   * Busca usuário por ID
   * 
   * @param id - ID do MongoDB
   * @returns Usuário encontrado
   * @throws NotFoundException se usuário não existir
   */
  async getUserById(id: string) {
    const user = await this.usersRepository.findById(id);
    
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }
    
    return user;
  }

  /**
   * Busca usuário por Cognito Sub
   * 
   * Usado ao validar token JWT do Cognito
   * 
   * @param cognitoSub - Sub claim do token
   * @returns Usuário encontrado ou null
   */
  async getUserByCognitoSub(cognitoSub: string) {
    return await this.usersRepository.findByCognitoSub(cognitoSub);
  }

  /**
   * Busca usuário por username
   * 
   * @param username - Username do usuário
   * @returns Usuário encontrado
   * @throws NotFoundException se usuário não existir
   */
  async getUserByUsername(username: string) {
    const user = await this.usersRepository.findByUsername(username);
    
    if (!user) {
      throw new NotFoundException(`Usuário @${username} não encontrado`);
    }
    
    return user;
  }

  /**
   * Lista usuários com paginação
   * 
   * @param params - Parâmetros de busca
   * @returns Usuários paginados
   */
  async listUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }) {
    return await this.usersRepository.findMany(params || {});
  }

  /**
   * Atualiza perfil do usuário
   * 
   * NOTA: Se atualizar email, deve sincronizar com Cognito via AWS SDK
   * 
   * @param id - ID do usuário
   * @param data - Dados para atualizar
   * @returns Usuário atualizado
   * @throws NotFoundException se usuário não existir
   * @throws ConflictException se email/username já existir
   */
  async updateUser(id: string, data: UpdateUserData) {
    this.logger.log(`Updating user: ${id}`);

    // Verificar se usuário existe
    await this.getUserById(id);

    // Se está atualizando email, verificar se não existe
    if (data.email) {
      const existing = await this.usersRepository.findByEmail(data.email);
      if (existing && existing.id !== id) {
        throw new ConflictException('Email já está em uso');
      }
    }

    // Se está atualizando username, verificar se não existe
    if (data.username) {
      const existing = await this.usersRepository.findByUsername(data.username);
      if (existing && existing.id !== id) {
        throw new ConflictException('Username já está em uso');
      }
    }

    return await this.usersRepository.update(id, data);
  }

  /**
   * Deleta um usuário
   * 
   * IMPORTANTE: Também delete do Cognito User Pool via AWS SDK
   * 
   * @param id - ID do usuário
   * @returns Confirmação de deleção
   * @throws NotFoundException se usuário não existir
   */
  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Deleting user: ${id}`);

    // Verificar se usuário existe
    await this.getUserById(id);

    // TODO: Deletar do Cognito via AWS SDK
    // await cognitoClient.adminDeleteUser({
    //   UserPoolId: env.COGNITO_USER_POOL_ID,
    //   Username: user.cognitoSub
    // });

    await this.usersRepository.delete(id);
    
    return { 
      success: true, 
      message: 'Usuário deletado com sucesso (MongoDB). Lembre-se de deletar do Cognito também.' 
    };
  }

  /**
   * Sincroniza ou cria usuário baseado no token Cognito
   * 
   * Chamado automaticamente ao fazer login (middleware de autenticação)
   * 
   * Fluxo:
   * 1. Valida token JWT do Cognito
   * 2. Extrai claims (sub, email, name)
   * 3. Busca usuário no MongoDB pelo cognitoSub
   * 4. Se não existe, cria automaticamente
   * 5. Se existe, sincroniza dados básicos (email, name)
   * 
   * @param tokenPayload - Claims do token JWT do Cognito
   * @returns Usuário sincronizado
   */
  async syncUserFromCognito(tokenPayload: CognitoTokenPayload) {
    this.logger.log(`Syncing user from Cognito: ${tokenPayload.email}`);

    // Buscar ou criar usuário
    const user = await this.usersRepository.findOrCreateFromCognito({
      cognitoSub: tokenPayload.sub,
      email: tokenPayload.email,
      name: tokenPayload.name || 'Novo Usuário',
      username: tokenPayload['cognito:username'] || tokenPayload.email.split('@')[0],
    });

    // Sincronizar dados básicos se mudaram no Cognito
    if (user.email !== tokenPayload.email || user.name !== (tokenPayload.name || user.name)) {
      this.logger.log(`Syncing updated data from Cognito for user: ${user.id}`);
      
      await this.usersRepository.update(user.id, {
        email: tokenPayload.email,
        name: tokenPayload.name || user.name,
      });
    }

    return user;
  }

  /**
   * Bane um usuário (moderação interna)
   * 
   * NOTA: Isso não impede login no Cognito, apenas marca na aplicação
   * Para bloquear login, use Cognito AdminDisableUser
   * 
   * @param id - ID do usuário
   * @param reason - Motivo do banimento
   * @returns Usuário banido
   */
  async banUser(id: string, reason: string) {
    this.logger.log(`Banning user: ${id} - Reason: ${reason}`);

    return await this.usersRepository.update(id, {
      isBanned: true,
      isActive: false,
      banReason: reason,
    });
  }

  /**
   * Desbane um usuário
   * 
   * @param id - ID do usuário
   * @returns Usuário desbanido
   */
  async unbanUser(id: string) {
    this.logger.log(`Unbanning user: ${id}`);

    return await this.usersRepository.update(id, {
      isBanned: false,
      isActive: true,
      banReason: undefined,
    });
  }

  /**
   * Atualiza role do usuário (apenas ADMIN)
   * 
   * @param id - ID do usuário
   * @param role - Novo role
   * @returns Usuário atualizado
   */
  async updateUserRole(id: string, role: string) {
    this.logger.log(`Updating user role: ${id} → ${role}`);

    return await this.usersRepository.update(id, {
      role: role as any,
    });
  }
}
