/**
 * Repositório de Usuários
 * 
 * Camada de acesso a dados para usuários.
 * Integrado com Amazon Cognito (autenticação gerenciada pela AWS).
 * 
 * @module modules/users/users.repository
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UserRole } from './user.model.js';
import type { User, CreateUserData, UpdateUserData } from './user.model.js';
import { env } from '../../config/env.js';

/**
 * Repositório de Usuários
 * 
 * IMPORTANTE: Este repositório NÃO gerencia senhas ou autenticação.
 * Amazon Cognito é responsável por:
 * - Senhas (hash, validação, reset)
 * - Verificação de email
 * - MFA (multi-factor authentication)
 * - Login social (Google, Facebook, etc)
 */
@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo usuário no MongoDB
   * 
   * Chamado quando:
   * - Usuário se registra via Cognito (Lambda Post-Confirmation)
   * - Admin cria usuário manualmente
   * 
   * @param data - Dados do usuário (com cognitoSub)
   * @param cognitoCreatedAt - Data de criação do Cognito (opcional, para sincronização)
   * @returns Usuário criado
   */
  async create(data: CreateUserData, cognitoCreatedAt?: Date): Promise<User> {
    this.logger.log(`Creating user: ${data.fullName} (Cognito Sub: ${data.cognitoSub})`);
    
    // Mapear os dados para o formato esperado pelo Prisma
    // Importante: o modelo User no Prisma NÃO possui coluna avatar. A URL do avatar
    // é sempre derivada do cognitoSub via CloudinaryService.
    const userData: any = {
      cognitoSub: data.cognitoSub,
      fullName: data.fullName,
      // Nickname público único da aplicação (persistido no Mongo/Prisma)
      ...(data.nickname && { nickname: data.nickname }),
      // email is not part of the User model in Prisma schema
      ...(data.bio && { bio: data.bio }),
      ...(data.website && { website: data.website }),
      ...(data.socialLinks && { socialLinks: data.socialLinks }),
      role: (data.role || UserRole.AUTHOR) as UserRole,
      // Sincroniza createdAt com Cognito se disponível (boa prática recomendada)
      ...(cognitoCreatedAt && { createdAt: cognitoCreatedAt }),
      // updatedAt não é definido na criação (será null até primeira atualização)
    };
    
    const createdUser = await this.prisma.user.create({ 
      data: userData
    });
    return createdUser as unknown as User;
  }

  /**
   * Busca usuário por CognitoSub (chave primária)
   * 
   * ATUALIZADO: cognitoSub agora é a chave primária (@id)
   * 
   * @param cognitoSub - CognitoSub do usuário
   * @returns Usuário encontrado ou null
   */
  async findById(cognitoSub: string): Promise<User | null> {
    this.logger.log(`Finding user by CognitoSub: ${cognitoSub}`);
    return await this.prisma.user.findUnique({ where: { cognitoSub } }) as User | null;
  }

  /**
   * Busca usuário por Cognito Sub (ID do Cognito)
   * 
   * IMPORTANTE: Use este método ao validar JWT do Cognito
   * 
   * @param cognitoSub - Sub claim do token JWT
   * @returns Usuário encontrado ou null
   */
  async findByCognitoSub(cognitoSub: string): Promise<User | null> {
    this.logger.log(`Finding user by Cognito Sub: ${cognitoSub}`);
    return await this.prisma.user.findUnique({ 
      where: { cognitoSub } 
    }) as User | null;
  }

  /**
   * Busca usuário por username
   * 
   * @param username - Nome de usuário
   * @returns Usuário encontrado ou null
   */
  async findByUsername(username: string): Promise<User | null> {
    this.logger.log(`Finding user by username: ${username}`);
    return await this.prisma.user.findFirst({ 
      where: { 
        fullName: username
      }
    }) as User | null;
  }

  /**
   * Busca usuário por nome completo (exato)
   * @param fullName - Nome completo
   */
  async findByName(fullName: string): Promise<User | null> {
    this.logger.log(`Finding user by fullName: ${fullName}`);
    return await this.prisma.user.findFirst({
      where: { fullName }
    }) as User | null;
  }

  /**
   * Verifica se existe usuário com o nome informado.
   * @param fullName Nome completo
   * @returns `true` quando encontrado, senão `false`
   */
  async isNameTaken(fullName: string): Promise<boolean> {
    const found = await this.prisma.user.findFirst({ where: { fullName } });
    return !!found;
  }





  /**
   * Lista usuários com paginação e filtros
   * 
   * @param params - Parâmetros de busca
   * @returns Usuários paginados
   */
  async findMany(params: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<{
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (params.role) where.role = params.role as UserRole;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    
    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { bio: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users as unknown as User[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Atualiza um usuário
   * 
   * NOTA: Email gerenciado apenas no Cognito
   * 
   * @param cognitoSub - CognitoSub do usuário (chave primária)
   * @param data - Dados para atualizar
   * @returns Usuário atualizado
   */
  async update(cognitoSub: string, data: UpdateUserData): Promise<User> {
    this.logger.log(`Updating user: ${cognitoSub}`);

    const updateData: any = {};
    
    // Nickname pode ser atualizado explicitamente (via fluxo /auth/change-nickname)
    if (data.nickname !== undefined) {
      updateData.nickname = data.nickname ?? null;
    }
    // fullName é obrigatório no schema, então não pode ser null
    if (data.fullName !== undefined && data.fullName && data.fullName.trim()) {
      updateData.fullName = data.fullName.trim();
    }
    // Campos opcionais podem ser null (exceto avatar, que não existe no schema)
    if (data.bio !== undefined) {
      // Converte string vazia em null para economizar espaço no banco
      if (typeof data.bio === 'string') {
        updateData.bio = data.bio.trim() || null;
      } else {
        updateData.bio = data.bio;
      }
    }
    if (data.website !== undefined) {
      // Converte string vazia em null para economizar espaço no banco
      if (typeof data.website === 'string') {
        updateData.website = data.website.trim() || null;
      } else {
        updateData.website = data.website;
      }
    }
    if (data.socialLinks !== undefined) {
      updateData.socialLinks = data.socialLinks || null;
    }
    if (data.role !== undefined) {
      updateData.role = data.role;
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }
    if (data.isBanned !== undefined) {
      updateData.isBanned = data.isBanned;
    }
    if (data.banReason !== undefined) {
      updateData.banReason = data.banReason || null;
    }

    // Atualiza updatedAt sempre que há uma atualização
    updateData.updatedAt = new Date();

    // Valida se há pelo menos um campo para atualizar (além de updatedAt)
    const fieldsToUpdate = Object.keys(updateData).filter(key => key !== 'updatedAt');
    if (fieldsToUpdate.length === 0) {
      this.logger.warn(`Nenhum campo para atualizar para usuário ${cognitoSub}`);
      // Retorna o usuário atual se não houver nada para atualizar
      const existingUser = await this.findById(cognitoSub);
      if (!existingUser) {
        throw new Error(`Usuário ${cognitoSub} não encontrado`);
      }
      return existingUser;
    }

    try {
      return await this.prisma.user.update({
        where: { cognitoSub },
        data: updateData,
      }) as unknown as User;
    } catch (error) {
      this.logger.error(`Erro ao atualizar usuário ${cognitoSub}:`, error);
      throw error;
    }
  }

  /**
   * Deleta um usuário do MongoDB
   * 
   * IMPORTANTE: Também delete do Cognito via AWS SDK
   * 
   * @param cognitoSub - CognitoSub do usuário (chave primária)
   * @returns Sucesso da operação
   */
  async delete(cognitoSub: string): Promise<boolean> {
    this.logger.log(`Deleting user: ${cognitoSub}`);
    await this.prisma.user.delete({ where: { cognitoSub } });
    return true;
  }

  /**
   * Atualiza o papel do usuário
   * 
   * @param cognitoSub - CognitoSub do usuário (chave primária)
   * @param role - Novo papel do usuário
   * @returns Usuário atualizado
   */
  async updateUserRole(cognitoSub: string, role: UserRole) {
    this.logger.log(`Updating user role: ${cognitoSub} → ${role}`);

    if (!Object.values(UserRole).includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }

    return await this.update(cognitoSub, {
      role,
    });
  }

  /**
   * Incrementa contador de posts do usuário
   * 
   * @param cognitoSub - CognitoSub do usuário (chave primária)
   */
  async incrementPostsCount(cognitoSub: string): Promise<void> {
    await this.prisma.user.update({
      where: { cognitoSub },
      data: { 
        postsCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Decrementa contador de posts do usuário
   * 
   * @param cognitoSub - CognitoSub do usuário (chave primária)
   */
  async decrementPostsCount(cognitoSub: string): Promise<void> {
    await this.prisma.user.update({
      where: { cognitoSub },
      data: { 
        postsCount: { decrement: 1 },
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Incrementa contador de comentários do usuário
   * 
   * @param cognitoSub - CognitoSub do usuário (chave primária)
   */
  async incrementCommentsCount(cognitoSub: string): Promise<void> {
    await this.prisma.user.update({
      where: { cognitoSub },
      data: { 
        commentsCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Busca dados do usuário no Cognito incluindo data de criação
   * 
   * @param cognitoSub - Sub do Cognito
   * @returns Data de criação do Cognito ou undefined
   */
  private async getCognitoUserCreatedAt(cognitoSub: string): Promise<Date | undefined> {
    try {
      const { CognitoIdentityProviderClient, AdminGetUserCommand } = await import('@aws-sdk/client-cognito-identity-provider');
      const client = new CognitoIdentityProviderClient({ 
        region: env.AWS_REGION 
      });
      
      const command = new AdminGetUserCommand({
        UserPoolId: env.COGNITO_USER_POOL_ID!!,
        Username: cognitoSub,
      });
      
      const response = await client.send(command);
      
      // Cognito retorna UserCreateDate em formato Date
      if (response.UserCreateDate) {
        return response.UserCreateDate;
      }
      
      return undefined;
    } catch (error) {
      this.logger.warn(`Não foi possível obter data de criação do Cognito para ${cognitoSub}: ${(error as Error).message}`);
      return undefined;
    }
  }

  /**
   * Busca ou cria usuário baseado no token Cognito
   * 
   * Chamado automaticamente ao fazer login via Cognito.
   * Sincroniza createdAt com o Cognito na primeira criação (boa prática recomendada).
   * 
   * @param cognitoData - Dados do token Cognito
   * @param cognitoCreatedAt - Data de criação do Cognito (opcional, será buscada se não fornecida)
   * @returns Usuário encontrado ou criado
   */
  async findOrCreateFromCognito(cognitoData: {
    cognitoSub: string;
    fullName: string;
  }, cognitoCreatedAt?: Date): Promise<User> {
    this.logger.log(`Finding or creating user from Cognito: ${cognitoData.cognitoSub}`);

    // Tenta buscar usuário existente
    let user = await this.findByCognitoSub(cognitoData.cognitoSub);

    // Se não existe, cria automaticamente
    if (!user) {
      this.logger.log(`User not found, creating new user: ${cognitoData.fullName}`);
      
      // Se não foi fornecida a data, busca do Cognito para sincronização
      let createdAt = cognitoCreatedAt;
      if (!createdAt) {
        createdAt = await this.getCognitoUserCreatedAt(cognitoData.cognitoSub);
      }
      
      user = await this.create({
        cognitoSub: cognitoData.cognitoSub,
        fullName: cognitoData.fullName,
        role: UserRole.AUTHOR
      }, createdAt);
      
      if (createdAt) {
        this.logger.log(`✅ createdAt sincronizado com Cognito: ${createdAt.toISOString()}`);
      }
    }

    return user;
  }

  /**
   * Atualiza atributos do usuário no Cognito
   * 
   * @param cognitoSub - Sub do Cognito
   * @param attributes - Atributos para atualizar
   */
  async updateCognitoAttributes(cognitoSub: string, attributes: { fullName?: string }): Promise<void> {
    this.logger.log(`Updating Cognito attributes for: ${cognitoSub}`);
    
    const { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } = await import('@aws-sdk/client-cognito-identity-provider');
    
    const client = new CognitoIdentityProviderClient({ region: env.AWS_REGION });
    
    const userAttributes = [];
    if (attributes.fullName) userAttributes.push({ Name: 'name', Value: attributes.fullName });
    
    if (userAttributes.length > 0) {
      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: env.COGNITO_USER_POOL_ID!,
        Username: cognitoSub,
        UserAttributes: userAttributes,
      });
      
      await client.send(command);
      this.logger.log(`Cognito attributes updated successfully`);
    }
  }

  /**
   * Altera senha do usuário no Cognito
   */
  async changePassword(cognitoSub: string, _oldPassword: string, newPassword: string): Promise<void> {
    this.logger.log(`Changing password for: ${cognitoSub}`);
    
    const { CognitoIdentityProviderClient, AdminSetUserPasswordCommand } = await import('@aws-sdk/client-cognito-identity-provider');
    
    const client = new CognitoIdentityProviderClient({ region: env.AWS_REGION });
    
    const command = new AdminSetUserPasswordCommand({
      UserPoolId: env.COGNITO_USER_POOL_ID!,
      Username: cognitoSub,
      Password: newPassword,
      Permanent: true,
    });
    
    await client.send(command);
    this.logger.log(`Password changed successfully`);
  }
}
