/**
 * Users Repository
 * 
 * Camada de acesso a dados para usuários.
 * Integrado com Amazon Cognito (autenticação gerenciada pela AWS).
 * 
 * @module modules/users/users.repository
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { User, CreateUserData, UpdateUserData } from './user.model.js';
import { Prisma } from '@prisma/client';

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
   * @returns Usuário criado
   */
  async create(data: CreateUserData): Promise<User> {
    this.logger.log(`Creating user: ${data.email} (Cognito Sub: ${data.cognitoSub})`);

    return await this.prisma.user.create({ 
      data: data as any 
    }) as unknown as User;
  }

  /**
   * Busca usuário por ID interno (MongoDB ObjectId)
   * 
   * @param id - ID do MongoDB
   * @returns Usuário encontrado ou null
   */
  async findById(id: string): Promise<User | null> {
    this.logger.log(`Finding user by ID: ${id}`);
    return await this.prisma.user.findUnique({ where: { id } }) as User | null;
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
    return await this.prisma.user.findUnique({ where: { cognitoSub } as any }) as User | null;
  }

  /**
   * Busca usuário por email
   * 
   * @param email - Email do usuário
   * @returns Usuário encontrado ou null
   */
  async findByEmail(email: string): Promise<User | null> {
    this.logger.log(`Finding user by email: ${email}`);
    return await this.prisma.user.findUnique({ where: { email } }) as User | null;
  }

  /**
   * Busca usuário por username
   * 
   * @param username - Username do usuário
   * @returns Usuário encontrado ou null
   */
  async findByUsername(username: string): Promise<User | null> {
    this.logger.log(`Finding user by username: ${username}`);
    return await this.prisma.user.findUnique({ where: { username } }) as User | null;
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

    const where: Prisma.UserWhereInput = {};
    
    if (params.role) where.role = params.role as any;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { username: { contains: params.search, mode: 'insensitive' } },
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
   * NOTA: Se atualizar email, sincronize com Cognito via AWS SDK
   * 
   * @param id - ID do usuário
   * @param data - Dados para atualizar
   * @returns Usuário atualizado
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    this.logger.log(`Updating user: ${id}`);

    const updateData: Prisma.UserUpdateInput = {};
    
    if (data.email !== undefined) updateData.email = data.email;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.socialLinks !== undefined) updateData.socialLinks = data.socialLinks;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isBanned !== undefined) updateData.isBanned = data.isBanned;
    if (data.banReason !== undefined) updateData.banReason = data.banReason;

    return await this.prisma.user.update({
      where: { id },
      data: updateData,
    }) as unknown as User;
  }

  /**
   * Deleta um usuário do MongoDB
   * 
   * IMPORTANTE: Também delete do Cognito via AWS SDK
   * 
   * @param id - ID do usuário
   * @returns Sucesso da operação
   */
  async delete(id: string): Promise<boolean> {
    this.logger.log(`Deleting user: ${id}`);
    await this.prisma.user.delete({ where: { id } });
    return true;
  }

  /**
   * Incrementa contador de posts do usuário
   * 
   * @param userId - ID do usuário
   */
  async incrementPostsCount(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { postsCount: { increment: 1 } },
    });
  }

  /**
   * Decrementa contador de posts do usuário
   * 
   * @param userId - ID do usuário
   */
  async decrementPostsCount(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { postsCount: { decrement: 1 } },
    });
  }

  /**
   * Incrementa contador de comentários do usuário
   * 
   * @param userId - ID do usuário
   */
  async incrementCommentsCount(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { commentsCount: { increment: 1 } },
    });
  }

  /**
   * Busca ou cria usuário baseado no token Cognito
   * 
   * Chamado automaticamente ao fazer login via Cognito
   * 
   * @param cognitoData - Dados do token Cognito
   * @returns Usuário encontrado ou criado
   */
  async findOrCreateFromCognito(cognitoData: {
    cognitoSub: string;
    email: string;
    name: string;
    username?: string;
  }): Promise<User> {
    this.logger.log(`Finding or creating user from Cognito: ${cognitoData.email}`);

    // Tenta buscar usuário existente
    let user = await this.findByCognitoSub(cognitoData.cognitoSub);

    // Se não existe, cria automaticamente
    if (!user) {
      this.logger.log(`User not found, creating new user: ${cognitoData.email}`);
      
      user = await this.create({
        cognitoSub: cognitoData.cognitoSub,
        email: cognitoData.email,
        name: cognitoData.name,
        username: cognitoData.username || cognitoData.email.split('@')[0],
      });
    }

    return user;
  }
}
