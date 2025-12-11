/**
 * Serviço de Usuários
 * 
 * Camada de lógica de negócio para usuários.
 * Integrado com Amazon Cognito para autenticação.
 * 
 * @module modules/users/users.service
 */

import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { UsersRepository } from './users.repository.js';
import { UserRole } from './user.model.js';
import type { CreateUserData, UpdateUserData, CognitoTokenPayload } from './user.model.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { env } from '../../config/env.js';

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

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Verifica disponibilidade de nickname considerando MongoDB e Cognito.
   *
   * Regras:
   * - Retorna `false` se já existir no MongoDB para outro usuário.
   * - Se `excludeCognitoSub` for informado e o registro encontrado for do próprio
   *   usuário, retorna `true` (permitir atualização).
   * - Consulta no Cognito usando ListUsersCommand para verificar preferred_username e nickname.
   * - Garante que dois usuários diferentes (dois cognitoSub diferentes) não possam ter o mesmo nickname.
   *
   * @param nickname Nickname a verificar (mínimo 3 caracteres).
   * @param excludeCognitoSub Cognito Sub do usuário a ser ignorado na verificação.
   * @returns `true` se disponível; `false` caso contrário.
  */
  async checkNicknameAvailability(nickname: string, excludeCognitoSub?: string): Promise<boolean> {
    this.logger.log(`Checking nickname availability (Mongo only): ${nickname}${
      excludeCognitoSub ? ` (excluding user ${excludeCognitoSub})` : ''
    }`);

    // Validações básicas
    if (!nickname || nickname.length < 3) {
      return false;
    }

    try {
      // Verifica apenas no MongoDB se já existe usuário com esse nickname
      const existingUser = await this.usersRepository.findByUsername(nickname);

      if (!existingUser) {
        return true; // disponível
      }

      // Se for o próprio usuário (mesmo cognitoSub), considerar disponível
      if (excludeCognitoSub && existingUser.cognitoSub === excludeCognitoSub) {
        return true;
      }

      // Já está em uso por outro usuário
      return false;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Erro ao verificar disponibilidade do nickname (Mongo): ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Cria um novo usuário no MongoDB
   * 
   * Chamado por:
   * - Lambda Post-Confirmation Trigger do Cognito
   * - Admin criando usuário manualmente
   * 
   * @param data - Dados do usuário (deve incluir cognitoSub)
   * @returns Usuário criado
   * @throws ConflictException se username já existir
   */
  /**
   * Cria usuário no MongoDB (sincronizado com Cognito via triggers/atributos).
   * 
   * Segue a boa prática recomendada:
   * - Sincroniza createdAt com o Cognito na primeira criação
   * - Mantém updatedAt como null até primeira atualização real
   * 
   * @param data - Dados do usuário
   * @param cognitoCreatedAt - Data de criação do Cognito (opcional, será buscada automaticamente se não fornecida)
   * @returns Usuário criado
   */
  async createUser(data: CreateUserData, cognitoCreatedAt?: Date) {
    this.logger.log(`Creating user: ${data.fullName}`);

    // Verificar se cognitoSub já existe
    const existingUser = await this.usersRepository.findByCognitoSub(data.cognitoSub);
    if (existingUser) {
      throw new ConflictException('Usuário já existe com este Cognito Sub');
    }

    // Verificar se já existe usuário com mesmo fullName
    if (data.fullName) {
      const existingByName = await this.usersRepository.findByName(data.fullName);
      if (existingByName) {
        throw new ConflictException('Já existe usuário com este nome');
      }
    }

    // Se não foi fornecida a data do Cognito, buscar automaticamente (boa prática)
    let createdAt = cognitoCreatedAt;
    if (!createdAt && data.cognitoSub) {
      try {
        // Método privado do repository buscará a data do Cognito
        // Por enquanto, deixamos o repository fazer isso no findOrCreateFromCognito
        // Aqui podemos buscar diretamente se necessário
        const { CognitoIdentityProviderClient, AdminGetUserCommand } = await import('@aws-sdk/client-cognito-identity-provider');
        const client = new CognitoIdentityProviderClient({ 
          region: env.AWS_REGION 
        });
        
        const command = new AdminGetUserCommand({
          UserPoolId: env.COGNITO_USER_POOL_ID!!,
          Username: data.cognitoSub,
        });
        
        const response = await client.send(command);
        if (response.UserCreateDate) {
          createdAt = response.UserCreateDate;
          this.logger.log(`✅ createdAt sincronizado com Cognito: ${createdAt.toISOString()}`);
        }
      } catch (error) {
        this.logger.warn(`Não foi possível buscar data de criação do Cognito: ${(error as Error).message}`);
        // Continua sem a data do Cognito (usará now() como padrão)
      }
    }

    // Mapear campos para o formato do banco de dados
    const userData: CreateUserData = {
      cognitoSub: data.cognitoSub,
      fullName: data.fullName,
      ...(data.nickname && { nickname: data.nickname }),
      // Avatar não é mais persistido; sempre derivado de cognitoSub
      ...(data.bio && { bio: data.bio }),
      ...(data.website && { website: data.website }),
      ...(data.socialLinks && { socialLinks: data.socialLinks }),
      ...(data.role && { role: data.role })
    };

    // Criar usuário com createdAt sincronizado do Cognito (se disponível)
    return await this.usersRepository.create(userData, createdAt);
  }

  /**
   * Verifica se já existe usuário com o mesmo nome (fullName)
   */
  /**
   * Indica se já existe usuário com o mesmo nome (fullName).
   */
  async isNameTaken(fullName: string): Promise<boolean> {
    if (!fullName || !fullName.trim()) return false;
    const existing = await this.usersRepository.findByName(fullName.trim());
    return !!existing;
  }

  /**
   * Busca usuário por ID
   * 
   * @param id - ID do MongoDB
   * @returns Usuário encontrado
   * @throws NotFoundException se usuário não existir
   */
  /**
   * Retorna usuário por CognitoSub (chave primária) ou lança NotFound.
   * 
   * ATUALIZADO: Agora usa cognitoSub como identificador principal
   */
  async getUserById(cognitoSub: string) {
    const user = await this.usersRepository.findById(cognitoSub);
    
    if (!user) {
      throw new NotFoundException(`Usuário com CognitoSub ${cognitoSub} não encontrado`);
    }

    // Montar URL pública do avatar a partir do cognitoSub (sem campo avatar no banco)
    const avatarUrl = this.cloudinaryService.getPublicUrlFromId(user.cognitoSub);

    return {
      ...user,
      ...(avatarUrl ? { avatar: avatarUrl } : {}),
    };
  }

  /**
   * Busca usuário por Cognito Sub
   * 
   * Usado ao validar token JWT do Cognito
   * 
   * @param cognitoSub - Sub claim do token
   * @returns Usuário encontrado ou null
   */
  /**
   * Retorna usuário por Cognito Sub (ou `null`).
   *
   * Além do documento do MongoDB, busca `nickname`, `email` e `UserCreateDate`
   * no Cognito para enriquecer a resposta. Em falhas de integração, retorna os
   * dados disponíveis do MongoDB com `nickname` como fallback.
   *
   * @param cognitoSub Claim `sub` do Cognito.
   * @returns Usuário enriquecido com dados do Cognito quando disponíveis.
   */
  async getUserByCognitoSub(cognitoSub: string) {
    const user = await this.usersRepository.findByCognitoSub(cognitoSub);
    
    if (!user) {
      return null;
    }

    // Buscar nickname do Cognito e incluí-lo na resposta
    try {
      const { CognitoIdentityProviderClient, AdminGetUserCommand, ListUsersCommand } = await import('@aws-sdk/client-cognito-identity-provider');
      const client = new CognitoIdentityProviderClient({ 
        region: env.AWS_REGION 
      });

      // Buscar username correto usando ListUsersCommand procurando pelo sub
      let username: string | null = null;
      let cognitoNickname: string | null = null;
      let cognitoEmail: string | null = null;
      let userCreateDate: Date | null = null;
      
      try {
        // Buscar via ListUsersCommand usando filtro por sub (sub é um atributo padrão)
        // Como ListUsersCommand não suporta filtro por sub diretamente, vamos buscar e filtrar
        const listCommand = new ListUsersCommand({
          UserPoolId: env.COGNITO_USER_POOL_ID!,
          Limit: 60, // Aumentar se necessário
        });
        
        const listResponse = await client.send(listCommand);
        if (listResponse.Users) {
          const foundUser = listResponse.Users.find(u => {
            const sub = u.Attributes?.find(attr => attr.Name === 'sub')?.Value;
            return sub === cognitoSub;
          });
          
          if (foundUser) {
            username = foundUser.Username || null;
            // Buscar nickname diretamente dos atributos do usuário encontrado
            const nicknameAttr = foundUser.Attributes?.find(attr => attr.Name === 'nickname');
            cognitoNickname = nicknameAttr?.Value || null;
            // Buscar email
            const emailAttr = foundUser.Attributes?.find(attr => attr.Name === 'email');
            cognitoEmail = emailAttr?.Value || null;
            // Buscar data de criação
            if (foundUser.UserCreateDate) {
              userCreateDate = foundUser.UserCreateDate;
            }
          }
        }
        
        // Se não encontrou via ListUsersCommand, tenta usar cognitoSub como username
        if (!username) {
          try {
            const command = new AdminGetUserCommand({
              UserPoolId: env.COGNITO_USER_POOL_ID!,
              Username: cognitoSub,
            });
            
            const response = await client.send(command);
            const sub = response.UserAttributes?.find(attr => attr.Name === 'sub')?.Value;
            if (sub === cognitoSub) {
              username = response.Username || cognitoSub;
              const nicknameAttr = response.UserAttributes?.find(attr => attr.Name === 'nickname');
              cognitoNickname = nicknameAttr?.Value || null;
              const emailAttr = response.UserAttributes?.find(attr => attr.Name === 'email');
              cognitoEmail = emailAttr?.Value || null;
              // AdminGetUserCommand não retorna UserCreateDate, precisa buscar via ListUsersCommand
            }
          } catch (error) {
            this.logger.debug(`Erro ao buscar usando cognitoSub como username: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      } catch (listError) {
        this.logger.warn(`Erro ao buscar username via ListUsersCommand: ${listError instanceof Error ? listError.message : String(listError)}`);
      }

      // Se encontrou username, buscar dados completos via AdminGetUserCommand
      if (username && (!cognitoNickname || !cognitoEmail)) {
        try {
          const command = new AdminGetUserCommand({
            UserPoolId: env.COGNITO_USER_POOL_ID!,
            Username: username,
          });
          
          const response = await client.send(command);
          if (!cognitoNickname) {
            const nicknameAttr = response.UserAttributes?.find(attr => attr.Name === 'nickname');
            cognitoNickname = nicknameAttr?.Value || null;
          }
          if (!cognitoEmail) {
            const emailAttr = response.UserAttributes?.find(attr => attr.Name === 'email');
            cognitoEmail = emailAttr?.Value || null;
          }
        } catch (error) {
          this.logger.debug(`Erro ao buscar dados completos do usuário ${username}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      // Limpar email se tiver "Verificado" no final (problema do Cognito UI)
      if (cognitoEmail && cognitoEmail.endsWith('Verificado')) {
        cognitoEmail = cognitoEmail.replace('Verificado', '').trim();
      }
      
      // Se ainda não houver nickname salvo no Mongo, migrar o do Cognito
      if (!user.nickname && cognitoNickname) {
        try {
          await this.usersRepository.update(user.cognitoSub, {
            nickname: cognitoNickname,
          });
          this.logger.log(
            `Migrated nickname from Cognito to Mongo for user ${user.cognitoSub}: ${cognitoNickname}`,
          );
        } catch (updateError) {
          this.logger.warn(
            `Falha ao migrar nickname do Cognito para Mongo para ${user.cognitoSub}: ${
              updateError instanceof Error ? updateError.message : String(updateError)
            }`,
          );
        }
      }

      // Incluir nickname, email, avatar e data de criação na resposta
      // Priorizar sempre o nickname salvo no Mongo; Cognito vira apenas fonte de migração
      const finalNickname = user.nickname || cognitoNickname || undefined;
      const finalEmail = cognitoEmail || undefined;
      const avatarUrl = this.cloudinaryService.getPublicUrlFromId(user.cognitoSub);
      
      return {
        ...user,
        username: finalNickname,
        nickname: finalNickname,
        email: finalEmail,
        ...(avatarUrl ? { avatar: avatarUrl } : {}),
        userCreateDate: userCreateDate || undefined,
      };
    } catch (error) {
      // Se falhar ao buscar do Cognito, retornar usuário sem nickname (pois só existe no Cognito)
      this.logger.warn(`Erro ao buscar dados do Cognito para ${cognitoSub}: ${error instanceof Error ? error.message : String(error)}`);
      const avatarUrl = this.cloudinaryService.getPublicUrlFromId(user.cognitoSub);
      return {
        ...user,
        username: undefined,
        nickname: undefined,
        email: undefined,
        ...(avatarUrl ? { avatar: avatarUrl } : {}),
        userCreateDate: undefined,
      };
    }
  }





  /**
   * Lista usuários com paginação
   * 
   * @param params - Parâmetros de busca
   * @returns Usuários paginados
   */
  /**
   * Lista usuários com filtros e paginação.
   *
   * Parâmetros aceitos: `page`, `limit`, `role`, `search`.
   * `search` pode aplicar correspondência parcial em nome/username.
   *
   * @param params Filtros e paginação.
   * @returns Coleção paginada de usuários.
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
   * NOTA: Email gerenciado apenas no Cognito.
   * Campos de perfil (fullName, bio, avatar, website) são atualizados no MongoDB.
   * 
   * @param id - ID do usuário
   * @param data - Dados para atualizar
   * @returns Usuário atualizado
   * @throws NotFoundException se usuário não existir
   * @throws ConflictException se username já existir
   */
  /**
   * Atualiza perfil do usuário (sincroniza campo fullName no Cognito quando alterado).
   * 
   * ATUALIZADO: Agora usa cognitoSub como identificador principal
   * ATUALIZADO: Suporta upload de avatar para Cloudinary
   */
  async updateUser(
    cognitoSub: string, 
    data: UpdateUserData,
    avatarFile?: any
  ) {
    this.logger.log(`Updating user: ${cognitoSub}`);

    // Validar nickname (quando fornecido) antes de prosseguir
    if (data.nickname !== undefined && data.nickname !== null) {
      const trimmedNickname = data.nickname.trim();

      if (!trimmedNickname) {
        throw new ConflictException('Nickname não pode ser vazio.');
      }

      const isAvailable = await this.checkNicknameAvailability(
        trimmedNickname,
        cognitoSub,
      );

      if (!isAvailable) {
        throw new ConflictException('Já existe usuário com este nickname.');
      }

      data.nickname = trimmedNickname;
    }

    // Se houver arquivo de avatar, fazer upload para Cloudinary
    let avatarUrl: string | undefined;
    if (avatarFile) {
      try {
        // Deletar avatar antigo (ignora erro se não existir)
        try {
          await this.cloudinaryService.deleteImage(`avatars/${cognitoSub}`);
        } catch {
          // Ignora se não existir
        }

        // Upload novo avatar: pasta "avatars", public_id = cognitoSub
        // Resultado final no Cloudinary: avatars/cognitoSub.webp
        avatarUrl = await this.cloudinaryService.uploadImage(
          avatarFile,
          'avatars',  // pasta
          cognitoSub  // public_id (sem a pasta)
        );

        this.logger.log(`✅ Avatar salvo: ${avatarUrl}`);
      } catch (error) {
        const err = error as Error;
        // Não bloquear atualização de perfil se o avatar falhar.
        // Apenas loga o erro e segue usando o avatar anterior (ou URL derivada).
        this.logger.warn(
          `Erro ao fazer upload do avatar para ${cognitoSub}: ${err.message}`,
          err.stack,
        );
        avatarUrl = undefined;
      }
    }

    // Persistência somente no MongoDB/Prisma (fullName não é atualizado no Cognito aqui)
    const updatedUser = await this.usersRepository.update(cognitoSub, data);

    // Usar URL do upload se disponível, senão tentar construir a partir do cognitoSub
    const finalAvatarUrl = avatarUrl || this.cloudinaryService.getPublicUrlFromId(updatedUser.cognitoSub);

    return {
      ...updatedUser,
      ...(finalAvatarUrl ? { avatar: finalAvatarUrl } : {}),
    };
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
  /**
   * Deleta usuário no MongoDB.
   *
   * Observação: a remoção no Cognito deve ser realizada separadamente com AWS SDK.
   *
   * @param cognitoSub Claim `sub` do Cognito do usuário.
   * @returns Objeto `{ success: true, message }` de confirmação.
   */
  async deleteUser(cognitoSub: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Deleting user: ${cognitoSub}`);

    // Verificar se usuário existe
    await this.getUserById(cognitoSub);

    // TODO: Deletar do Cognito via AWS SDK
    // await cognitoClient.adminDeleteUser({
    //   UserPoolId: env.COGNITO_USER_POOL_ID,
    //   Username: cognitoSub
    // });

    await this.usersRepository.delete(cognitoSub);
    
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
   * 2. Extrai claims (sub, fullName)
   * 3. Busca usuário no MongoDB pelo cognitoSub
   * 4. Se não existe, cria automaticamente
   * 5. Se existe, sincroniza nome se mudou
   * 
   * @param tokenPayload - Claims do token JWT do Cognito
   * @returns Usuário sincronizado
   */
  /**
   * Sincroniza usuário a partir do token do Cognito (cria/atualiza).
   * 
   * Segue a boa prática recomendada:
   * - Sincroniza createdAt com o Cognito na primeira criação
   * - Mantém updatedAt como null até primeira atualização real
   * 
   * @param tokenPayload Payload do token JWT do Cognito (`sub`, `name`, etc.).
   * @param cognitoCreatedAt Data de criação do Cognito (opcional; buscada se ausente).
   * @returns Usuário existente ou criado/sincronizado.
  */
  async syncUserFromCognito(tokenPayload: CognitoTokenPayload, cognitoCreatedAt?: Date) {
    this.logger.log(`Syncing user from Cognito: ${tokenPayload.sub}`);

    // Buscar ou criar usuário (com sincronização de createdAt do Cognito)
    const user = await this.usersRepository.findOrCreateFromCognito({
      cognitoSub: tokenPayload.sub,
      fullName: tokenPayload.name || 'Novo Usuário',
    }, cognitoCreatedAt);

    // Sincronizar nome se mudou no Cognito
    if (tokenPayload.name && user.fullName !== tokenPayload.name) {
      this.logger.log(`Syncing updated fullName from Cognito for user: ${user.cognitoSub}`);
      
      const updatedUser = await this.usersRepository.update(user.cognitoSub, {
        fullName: tokenPayload.name,
      });
      return updatedUser || user;
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
  /**
   * Bane usuário (marca flags internas, não desabilita no Cognito).
   *
   * @param id Identificador do usuário (Cognito Sub ou ID).
   * @param reason Motivo descritivo do banimento.
   * @returns Usuário atualizado com `isBanned: true` e `isActive: false`.
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
  /**
   * Desbane usuário (reativa flags internas).
   *
   * @param id Identificador do usuário (Cognito Sub ou ID).
   * @returns Usuário atualizado com `isBanned: false` e `isActive: true`.
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
  /**
   * Atualiza role do usuário (ADMIN-only).
   *
   * @param id Identificador do usuário.
   * @param role Novo papel do usuário.
   * @returns Usuário com `role` atualizado.
   * @throws Error quando `role` não é um valor válido de `UserRole`.
   */
  async updateUserRole(id: string, role: UserRole) {
    this.logger.log(`Updating user role: ${id} → ${role}`);

    if (!Object.values(UserRole).includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }

    return await this.usersRepository.update(id, {
      role,
    });
  }

  /**
   * Altera senha do usuário no Cognito
   * 
   * @param cognitoSub - Sub do Cognito
   * @param oldPassword - Senha atual
   * @param newPassword - Nova senha
   */
  /**
   * Altera senha do usuário no Cognito.
   *
   * Delegado ao `UsersRepository` para execução da operação.
   *
   * @param cognitoSub Claim `sub` do Cognito.
   * @param _oldPassword Senha atual (não utilizada aqui; fluxo admin).
   * @param newPassword Nova senha a ser aplicada.
   * @returns `void` em sucesso; lança exceção em falhas.
   */
  async changePassword(cognitoSub: string, _oldPassword: string, newPassword: string): Promise<void> {
    this.logger.log(`Changing password for user: ${cognitoSub}`);
    await this.usersRepository.changePassword(cognitoSub, _oldPassword, newPassword);
  }

  /**
   * Atualiza apenas o nickname do usuário no MongoDB.
   *
   * Usado pelo fluxo de /auth/change-nickname, após validação e atualização
   * no Cognito. O Mongo/Prisma é a fonte de verdade do nickname para a
   * aplicação, então mantemos o campo sincronizado aqui.
   */
  async updateUserNickname(cognitoSub: string, nickname: string) {
    this.logger.log(`Updating user nickname in MongoDB: ${cognitoSub} -> ${nickname}`);

    await this.usersRepository.update(cognitoSub, {
      nickname,
    });
  }
}

