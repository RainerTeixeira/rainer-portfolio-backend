/**
 * AuthService
 *
 * Camada de orquestração de autenticação e sincronização de usuários.
 * - Integra com AWS Cognito por meio do `AuthRepository`
 * - Sincroniza/pereniza dados essenciais no MongoDB via `UsersService`
 * - Expõe fluxos de login, registro, confirmação de email, refresh, recuperação e reset de senha
 * - Fornece utilitários de verificação e alteração de nickname/username
 *
 * Princípios:
 * - Cognito é a autoridade de identidade (e-mail, senha, verificação, MFA)
 * - MongoDB guarda perfil e estatísticas (sem credenciais)
 *
 */
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { AuthRepository } from './auth.repository.js';
import { UsersService } from '../users/users.service.js';
import { env } from '../../config/env.js';
import type {
  LoginData,
  RegisterData,
  RefreshTokenData,
  ConfirmEmailData,
  ForgotPasswordData,
  ResetPasswordData,
  LoginResponse,
  RegisterResponse,
  RefreshTokenResponse,
  PasswordlessLoginInitData,
  PasswordlessLoginInitResponse,
  PasswordlessLoginVerifyData,
  PasswordlessLoginVerifyResponse,
} from './auth.model.js';

// Interface para o payload do token JWT
export interface JwtPayload {
  sub: string;
  email: string;
  fullName?: string;
  name?: string;
  nickname?: string;
  'cognito:username'?: string;
  preferred_username?: string;
  username?: string;
  [key: string]: unknown;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private static nameCache: Map<string, { available: boolean; ts: number }> = new Map();

  // Cache para prevenir uso duplicado de códigos OAuth (TTL: 60 segundos)
  private readonly processedCodes = new Map<string, { timestamp: number; processing: boolean }>();

  // Cache para armazenar senhas temporárias durante fluxo passwordless (TTL: 5 minutos)
  // Usado para autenticar após verificar código via ForgotPassword
  private readonly passwordlessTempPasswords = new Map<
    string,
    { tempPassword: string; timestamp: number }
  >();

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly usersService: UsersService
  ) {
    // Limpar códigos OAuth expirados a cada 60 segundos
    setInterval(() => {
      const now = Date.now();
      for (const [code, data] of this.processedCodes.entries()) {
        if (now - data.timestamp > 60000) {
          this.processedCodes.delete(code);
        }
      }
    }, 60000);

    // Limpar senhas temporárias passwordless expiradas a cada 60 segundos (TTL: 5 minutos)
    setInterval(() => {
      const now = Date.now();
      for (const [email, data] of this.passwordlessTempPasswords.entries()) {
        if (now - data.timestamp > 300000) {
          // 5 minutos
          this.passwordlessTempPasswords.delete(email);
        }
      }
    }, 60000);
  }

  /**
   * Verifica se um nickname (nickname) está disponível
   *
   * @param nickname - O nickname a ser verificado
   * @param currentUserId - Opcional: ID do usuário a ser excluído da verificação (para atualizações)
   * @returns true se o nickname estiver disponível, false caso contrário
   */
  private async checkNicknameAvailability(
    nickname: string,
    currentUserId?: string
  ): Promise<boolean> {
    try {
      this.logger.debug(
        `[checkNicknameAvailability] Verificando disponibilidade de nickname: ${nickname}`,
        {
          nickname,
          currentUserId,
        }
      );

      // Verifica se o nickname já está em uso no Cognito
      const { CognitoIdentityProviderClient, ListUsersCommand } = await import(
        '@aws-sdk/client-cognito-identity-provider'
      );

      const client = new CognitoIdentityProviderClient({ region: env.AWS_REGION });

      // Cognito não suporta OR em filtros, então precisamos fazer duas buscas separadas
      // ou buscar todos e filtrar manualmente
      // Vamos buscar por preferred_username primeiro
      try {
        const commandPreferred = new ListUsersCommand({
          UserPoolId: env.COGNITO_USER_POOL_ID!,
          Filter: `preferred_username = "${nickname}"`,
          Limit: 1,
        });

        const responsePreferred = await client.send(commandPreferred);

        if (responsePreferred.Users && responsePreferred.Users.length > 0) {
          const user = responsePreferred.Users[0];
          if (user.Attributes) {
            const userAttributes = user.Attributes.reduce<Record<string, string>>((acc, attr) => {
              if (attr.Name && attr.Value) {
                acc[attr.Name] = attr.Value;
              }
              return acc;
            }, {});
            const sub = userAttributes['sub'];

            // Se é o próprio usuário, está disponível para ele
            if (currentUserId && sub === currentUserId) {
              this.logger.debug(
                `[checkNicknameAvailability] Nickname pertence ao próprio usuário, disponível`
              );
              return true;
            }

            // Se não é o próprio usuário, não está disponível
            this.logger.debug(
              `[checkNicknameAvailability] Nickname já está em uso por outro usuário`
            );
            return false;
          }
        }
      } catch (error) {
        this.logger.warn(
          `[checkNicknameAvailability] Erro ao buscar por preferred_username: ${(error as Error).message}`
        );
        // Continua para verificar por nickname
      }

      // Agora busca por nickname
      try {
        const commandNickname = new ListUsersCommand({
          UserPoolId: env.COGNITO_USER_POOL_ID!,
          Filter: `nickname = "${nickname}"`,
          Limit: 1,
        });

        const responseNickname = await client.send(commandNickname);

        // Se encontrou algum usuário e não é o usuário atual, retorna falso
        if (responseNickname.Users && responseNickname.Users.length > 0) {
          if (currentUserId) {
            const user = responseNickname.Users[0];
            if (user.Attributes) {
              const userAttributes = user.Attributes.reduce<Record<string, string>>((acc, attr) => {
                if (attr.Name && attr.Value) {
                  acc[attr.Name] = attr.Value;
                }
                return acc;
              }, {});
              const sub = userAttributes['sub'];

              // Se é o próprio usuário, está disponível
              if (sub === currentUserId) {
                this.logger.debug(
                  `[checkNicknameAvailability] Nickname pertence ao próprio usuário, disponível`
                );
                return true;
              }

              // Se não é o próprio usuário, não está disponível
              this.logger.debug(
                `[checkNicknameAvailability] Nickname já está em uso por outro usuário`
              );
              return false;
            }
          }
          // Se encontrou usuário mas não tem currentUserId, não está disponível
          this.logger.debug(`[checkNicknameAvailability] Nickname já está em uso`);
          return false;
        }
      } catch (error) {
        this.logger.warn(
          `[checkNicknameAvailability] Erro ao buscar por nickname: ${(error as Error).message}`
        );
        // Se houver erro, assume que está disponível (fail-open)
        // Mas loga o erro para debug
      }

      // Se não encontrou em nenhuma busca, está disponível
      this.logger.debug(`[checkNicknameAvailability] Nickname disponível: ${nickname}`);
      return true;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `[checkNicknameAvailability] Erro ao verificar disponibilidade de nickname: ${err.message}`,
        err.stack
      );
      throw new InternalServerErrorException('Erro ao verificar disponibilidade de nickname');
    }
  }

  /**
   * Gera um nickname estável a partir do nome completo ou, em último caso, do sub.
   * - Remove acentos e caracteres inválidos
   * - Usa apenas letras, números, ponto, underscore e hífen
   * - Concatena primeiro e último nome quando possível
   * - Garante tamanho máximo razoável e fallback mínimo
   */
  private generateNicknameFromFullNameOrSub(fullName: string | undefined, sub: string): string {
    const normalize = (value: string): string => {
      return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_.-]/g, '')
        .toLowerCase();
    };

    if (fullName && fullName.trim().length > 0) {
      const parts = fullName
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(normalize)
        .filter(Boolean);

      let base = '';
      if (parts.length === 1) {
        base = parts[0];
      } else if (parts.length > 1) {
        const first = parts[0];
        const last = parts[parts.length - 1];
        base = last && last !== first ? `${first}${last}` : first;
      }

      if (base.length >= 3) {
        return base.substring(0, 30);
      }
    }

    // Fallback: usa o sub do Cognito normalizado
    const safeSub = normalize(sub);
    if (safeSub.length >= 6) {
      return safeSub.substring(0, 30);
    }

    return `user_${Date.now().toString(36)}`;
  }

  /**
   * Atualiza o e-mail do usuário no Cognito e dispara verificação.
   *
   * @param cognitoSub ID do usuário no Cognito (claim sub)
   * @param newEmail Novo endereço de e-mail a ser aplicado
   * @returns Objeto com `success` e `message` informativa
   * @throws ConflictException Quando e-mail já está em uso
   * @throws InternalServerErrorException Em caso de falha no Cognito
   */
  async changeEmail(cognitoSub: string, newEmail: string) {
    try {
      const { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } = await import(
        '@aws-sdk/client-cognito-identity-provider'
      );

      const client = new CognitoIdentityProviderClient({ region: env.AWS_REGION });

      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: env.COGNITO_USER_POOL_ID!,
        Username: cognitoSub,
        UserAttributes: [
          { Name: 'email', Value: newEmail },
          { Name: 'email_verified', Value: 'false' },
        ],
      });

      await client.send(command);
      return { success: true, message: 'Código de verificação enviado para o novo email.' };
    } catch (error: unknown) {
      const err = error as Error;
      if (err.name === 'AliasExistsException') {
        throw new ConflictException('Este email já está em uso');
      }
      throw new InternalServerErrorException('Erro ao alterar email');
    }
  }

  /**
   * Confirma alteração de e-mail no Cognito através do código enviado.
   *
   * @param cognitoSub Token de acesso/identificador
   * @param code Código recebido por e-mail
   * @returns Mensagem de sucesso
   * @throws BadRequestException Códigos inválidos/expirados
   * @throws InternalServerErrorException Erros inesperados
   */
  async verifyEmailChange(cognitoSub: string, code: string) {
    try {
      const { CognitoIdentityProviderClient, VerifyUserAttributeCommand } = await import(
        '@aws-sdk/client-cognito-identity-provider'
      );

      const client = new CognitoIdentityProviderClient({ region: env.AWS_REGION });

      const command = new VerifyUserAttributeCommand({
        AccessToken: cognitoSub,
        AttributeName: 'email',
        Code: code,
      });

      await client.send(command);
      return { success: true, message: 'Email verificado com sucesso!' };
    } catch (error: unknown) {
      const err = error as Error;
      if (err.name === 'CodeMismatchException') {
        throw new BadRequestException('Código de verificação inválido');
      }
      if (err.name === 'ExpiredCodeException') {
        throw new BadRequestException('Código de verificação expirado');
      }
      throw new InternalServerErrorException('Erro ao verificar email');
    }
  }

  /**
   * Autentica usuário no Cognito e garante sincronização no MongoDB.
   *
   * @param data Credenciais de login (email e senha)
   * @returns Tokens e dados mínimos do usuário autenticado
   * @throws UnauthorizedException Quando credenciais inválidas/usuário não confirmado
   * @throws InternalServerErrorException Falhas não mapeadas
   */
  async login(data: LoginData): Promise<LoginResponse> {
    try {
      this.logger.debug(`[Login] Iniciando login para: ${data.email}`);

      // 1. Autentica no Cognito
      this.logger.debug(`[Login] Autenticando no Cognito...`);
      const response = await this.authRepository.login(data);

      if (!response.AuthenticationResult) {
        this.logger.error(`[Login] ❌ Falha na autenticação: AuthenticationResult ausente`);
        throw new UnauthorizedException('Falha na autenticação');
      }

      const { AccessToken, RefreshToken, ExpiresIn, IdToken } = response.AuthenticationResult;

      if (!IdToken) {
        this.logger.error(`[Login] ❌ Token de autenticação inválido: IdToken ausente`);
        throw new UnauthorizedException('Token de autenticação inválido');
      }

      this.logger.debug(`[Login] ✅ Autenticação no Cognito bem-sucedida`);
      this.logger.debug(`[Login] Decodificando ID token...`);
      const payload = this.decodeToken(IdToken) as JwtPayload;
      this.logger.debug(
        `[Login] ✅ Token decodificado: sub=${payload.sub}, email=${payload.email}`
      );

      // 2. Busca ou cria usuário no MongoDB (com sincronização de createdAt do Cognito)
      this.logger.debug(`[Login] Buscando usuário no MongoDB: cognitoSub=${payload.sub}`);
      let user = await this.usersService.getUserByCognitoSub(payload.sub);

      if (!user) {
        this.logger.debug(`[Login] Usuário não encontrado no MongoDB, criando novo usuário...`);
        // Buscar data de criação do Cognito para sincronização (boa prática recomendada)
        let cognitoCreatedAt: Date | undefined;
        try {
          this.logger.debug(`[Login] Buscando data de criação do Cognito...`);
          const { CognitoIdentityProviderClient, AdminGetUserCommand } = await import(
            '@aws-sdk/client-cognito-identity-provider'
          );
          const client = new CognitoIdentityProviderClient({
            region: env.AWS_REGION,
          });

          const command = new AdminGetUserCommand({
            UserPoolId: env.COGNITO_USER_POOL_ID!,
            Username: payload.sub,
          });

          const response = await client.send(command);
          if (response.UserCreateDate) {
            cognitoCreatedAt = response.UserCreateDate;
            this.logger.log(
              `✅ createdAt sincronizado com Cognito no login: ${cognitoCreatedAt.toISOString()}`
            );
          }
        } catch (error) {
          this.logger.warn(
            `Não foi possível buscar data de criação do Cognito: ${(error as Error).message}`
          );
        }

        const email =
          payload.email || `${payload.sub.replace(/[^a-zA-Z0-9]/g, '')}@temporary.email`;
        this.logger.debug(
          `[Login] Criando usuário no MongoDB: email=${email}, fullName=${(payload.name as string) || 'Usuário'}`
        );
        const createdUser = await this.usersService.createUser(
          {
            cognitoSub: payload.sub,
            fullName: (payload.name as string) || 'Usuário',
            email: email,
          },
          cognitoCreatedAt
        );

        // Buscar novamente para obter todos os campos (incluindo username do Cognito se disponível)
        this.logger.debug(`[Login] Buscando usuário criado novamente...`);
        user = await this.usersService.getUserByCognitoSub(payload.sub);

        // Se ainda for null, usar o usuário criado como fallback
        if (!user) {
          this.logger.warn(`[Login] ⚠️  Usuário não encontrado após criação, usando fallback`);
          user = {
            ...createdUser,
            username: payload.username || payload['cognito:username'] || payload.preferred_username,
            nickname: payload.nickname,
            email: email,
            userCreateDate: undefined,
          };
        }
      } else {
        this.logger.debug(`[Login] ✅ Usuário encontrado no MongoDB`);
      }

      // Verificar que user não é null (proteção adicional)
      if (!user) {
        this.logger.error(`[Login] ❌ Erro crítico: user é null após todas as tentativas`);
        throw new InternalServerErrorException('Erro ao buscar ou criar usuário');
      }

      // 3. Retorna resposta no formato esperado pelo frontend
      // Frontend espera: { tokens: {...}, user: {...} }
      return {
        tokens: {
          accessToken: AccessToken!,
          refreshToken: RefreshToken!,
          idToken: IdToken,
          tokenType: 'Bearer',
          expiresIn: ExpiresIn!,
        },
        user: {
          id: user.id,
          cognitoSub: user.cognitoSub || payload.sub,
          fullName: user.fullName,
          email: payload.email || '',
          avatar: user.avatar,
          bio: user.bio,
          website: user.website,
          socialLinks: user.socialLinks,
          role: user.role, // UserRole sempre existe no User
          isActive: user.isActive,
          isBanned: user.isBanned,
          postsCount: user.postsCount,
          commentsCount: user.commentsCount,
        },
      };
    } catch (error: unknown) {
      this.logger.error(`[Login] ❌ Erro ao realizar login (serviço de autenticação)`);

      if (error instanceof Error) {
        this.logger.error(`[Login] Tipo do erro: ${error.constructor.name}`);
        this.logger.error(`[Login] Mensagem: ${error.message}`);
        this.logger.error(`[Login] Stack: ${error.stack?.split('\n').slice(0, 5).join('\n')}`);

        if (error.name === 'NotAuthorizedException') {
          this.logger.warn(`[Login] Credenciais inválidas para: ${data.email}`);
          throw new UnauthorizedException('Email ou senha incorretos');
        }
        if (error.name === 'UserNotConfirmedException') {
          this.logger.warn(`[Login] Email não confirmado: ${data.email}`);
          throw new UnauthorizedException('Email não confirmado. Verifique seu email.');
        }
        if (
          error instanceof UnauthorizedException ||
          error instanceof InternalServerErrorException
        ) {
          throw error;
        }
      } else {
        this.logger.error(`[Login] Erro desconhecido: ${JSON.stringify(error)}`);
      }

      // Caso específico: fluxo USER_PASSWORD_AUTH não habilitado para o App Client do Cognito
      // Esse é um erro de configuração interna, não culpa do usuário final.
      if (
        (error as Error)?.name === 'InvalidParameterException' &&
        (error as Error)?.message?.includes('USER_PASSWORD_AUTH flow not enabled for this client')
      ) {
        this.logger.error(
          '[Login] Configuração do Cognito inválida: fluxo USER_PASSWORD_AUTH não habilitado para o clientId atual'
        );

        // Mensagem amigável para o frontend exibir ao usuário
        throw new InternalServerErrorException(
          'Serviço de login temporariamente indisponível por erro de configuração interna. ' +
            'O fluxo de login por senha ainda não está habilitado no provedor de autenticação. ' +
            'Tente novamente mais tarde ou entre em contato com o suporte se o problema persistir.'
        );
      }

      throw new InternalServerErrorException(
        'Erro ao realizar login (serviço de autenticação)'
      );
    }
  }

  /**
   * Registra novo usuário no Cognito e cria perfil no MongoDB.
   *
   * Regras:
   * - Gera e valida `username` único no Pool
   * - Normaliza `nickname` como atributo
   *
   * @param data Dados de registro (email, senha, nome, nickname)
   * @returns Informações de criação e necessidade de verificação
   * @throws ConflictException Email/nome já em uso
   * @throws BadRequestException Parâmetros/senha inválidos
   * @throws InternalServerErrorException Falhas gerais
   */
  async register(data: RegisterData): Promise<RegisterResponse> {
    try {
      // 0) Checar email já existente no Cognito
      const existingEmailUser = await this.authRepository.getUserByEmail(data.email);
      if (existingEmailUser) {
        throw new ConflictException(
          'Este email já está em uso (serviço de autenticação)'
        );
      }

      // 0.1) Checar nome já existente no MongoDB
      const nameTaken = await this.usersService.isNameTaken(data.fullName);
      if (nameTaken) {
        throw new ConflictException(
          'Já existe usuário com este nome (serviço de autenticação)'
        );
      }

      // 1) Gerar Username a partir do Nome Completo (substitui espaços por '_', remove inválidos)
      const baseUsername =
        (data.fullName || 'user')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_.-]/g, '')
          .replace(/^_+|_+$/g, '') || `user_${Date.now()}`;

      // 2) Garante unicidade no pool (tenta base, base_1, base_2, ...)
      let candidate = baseUsername;
      let suffix = 0;
      for (;;) {
        const tryUsername = suffix > 0 ? `${candidate}_${suffix}` : candidate;
        try {
          await this.authRepository.getUserByUsername(tryUsername);
          // Existe → tenta próximo
          suffix += 1;
        } catch (e: unknown) {
          const err = e as Error;
          if (err?.name === 'UserNotFoundException') {
            candidate = tryUsername;
            break;
          }
          throw new InternalServerErrorException(
            'Erro ao verificar disponibilidade do nome de usuário (serviço de autenticação)'
          );
        }
      }

      // 3) Nickname obrigatório e armazenado como atributo
      const cleanNickname = (data.nickname || '').toLowerCase().replace(/[^a-z0-9_.-]/g, '');

      const cognitoData: RegisterData & { username: string } = {
        ...data,
        username: candidate,
        email: data.email,
        nickname: cleanNickname || data.nickname,
      };

      // 2. Registra no Cognito
      // O Cognito automaticamente:
      // - Envia código de confirmação por email (se configurado)
      // - Mantém usuário em estado "UNCONFIRMED" até confirmação
      // - Não habilita login até que o usuário confirme o código
      const cognitoResponse = await this.authRepository.register(cognitoData);
      const cognitoSub = cognitoResponse.UserSub!;

      // Log detalhado sobre o envio do email
      if (cognitoResponse.CodeDeliveryDetails) {
        this.logger.log(
          `✅ Código de confirmação enviado via ${cognitoResponse.CodeDeliveryDetails.DeliveryMedium} ` +
            `para ${cognitoResponse.CodeDeliveryDetails.Destination}`
        );
      } else {
        // ⚠️ PROBLEMA CRÍTICO: CodeDeliveryDetails ausente
        // Isso significa que o Cognito NÃO tentou enviar o email automaticamente
        // Isso geralmente acontece quando:
        // 1. Auto-verification está desligado no User Pool
        // 2. App Client não está configurado para enviar emails
        // 3. SES não está configurado ou está bloqueando emails
        this.logger.error(
          `❌ CodeDeliveryDetails AUSENTE na resposta do SignUp para ${candidate}. ` +
            `O Cognito NÃO tentou enviar o email automaticamente. ` +
            `Isso indica um problema na configuração do User Pool.`
        );
        this.logger.error(
          `🔧 AÇÃO NECESSÁRIA: Verifique no Console AWS Cognito:\n` +
            `   - User Pool > Sign-up experience > Message delivery\n` +
            `   - User Pool > App clients > Seu App Client > Enable email verification\n` +
            `   - Verifique se SES está configurado e não está em sandbox para este domínio`
        );

        // Tenta enviar explicitamente como fallback
        this.logger.warn(
          `⚠️ Tentando enviar código de confirmação explicitamente como fallback...`
        );

        try {
          // Aguarda um momento para garantir que o usuário foi criado completamente
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Tenta reenviar o código usando o método normal
          await this.authRepository.resendConfirmationCode(candidate);
          this.logger.log(
            `✅ Código de confirmação enviado com sucesso via fallback para: ${data.email}`
          );
        } catch (resendError) {
          const resendErr = resendError as Error & { fullName?: string };
          this.logger.error(`❌ Fallback também falhou: ${resendErr.name} - ${resendErr.message}`);
          this.logger.error(
            `⚠️ ATENÇÃO: O usuário foi criado, mas o email de confirmação NÃO foi enviado. ` +
              `O usuário precisará solicitar reenvio do código manualmente ou ` +
              `você precisará corrigir a configuração do Cognito.`
          );
          // Não falhamos o registro, mas logamos o erro crítico
        }
      }

      this.logger.log(
        `Usuário registrado no Cognito: ${candidate} (${cognitoSub}, Confirmado: ${cognitoResponse.UserConfirmed})`
      );

      // Nota: Não precisamos desabilitar manualmente. O Cognito gerencia o estado automaticamente:
      // - Usuários não confirmados estão em estado "UNCONFIRMED"
      // - Eles não podem fazer login até confirmar o email
      // - O código de confirmação é enviado automaticamente pelo Cognito durante o SignUp
      //   (ou tentamos enviar explicitamente se não veio no SignUp)

      // 3. Cria perfil no MongoDB referenciando apenas o sub
      // Busca data de criação do Cognito para sincronização (boa prática recomendada)
      let cognitoCreatedAt: Date | undefined;
      try {
        const { CognitoIdentityProviderClient, AdminGetUserCommand } = await import(
          '@aws-sdk/client-cognito-identity-provider'
        );
        const client = new CognitoIdentityProviderClient({
          region: env.AWS_REGION,
        });

        const command = new AdminGetUserCommand({
          UserPoolId: env.COGNITO_USER_POOL_ID!,
          Username: cognitoSub,
        });

        const response = await client.send(command);
        if (response.UserCreateDate) {
          cognitoCreatedAt = response.UserCreateDate;
          this.logger.log(
            `✅ createdAt sincronizado com Cognito no registro: ${cognitoCreatedAt.toISOString()}`
          );
        }
      } catch (error) {
        this.logger.warn(
          `Não foi possível buscar data de criação do Cognito: ${(error as Error).message}`
        );
        // Continua sem a data (usará now() como padrão)
      }

      try {
        await this.usersService.createUser(
          {
            cognitoSub: cognitoSub,
            fullName: data.fullName,
            nickname: cleanNickname || data.nickname,
          },
          cognitoCreatedAt
        );
      } catch (mongoError: unknown) {
        // Se falhar ao criar no MongoDB, loga o erro
        this.logger.error('Erro ao criar usuário no MongoDB:', mongoError as Error);

        // Verifica se é erro de duplicação
        if ((mongoError as { code?: string }).code === 'P2002') {
          throw new ConflictException('Email ou nickname já cadastrado no sistema');
        }

        throw new InternalServerErrorException('Erro ao criar perfil do usuário');
      }

      return {
        userId: cognitoSub,
        email: data.email,
        fullName: data.fullName,
        username: candidate, // Retorna o username gerado para uso na confirmação
        emailVerificationRequired: !cognitoResponse.UserConfirmed,
        message: cognitoResponse.UserConfirmed
          ? 'Usuário criado com sucesso!'
          : 'Usuário criado com sucesso. Verifique seu email para confirmar o cadastro.',
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'UsernameExistsException') {
          throw new BadRequestException('Email já cadastrado no Cognito');
        }
        if (error.name === 'InvalidPasswordException') {
          throw new BadRequestException('Senha não atende aos requisitos de segurança');
        }
        if (error.name === 'InvalidParameterException') {
          throw new BadRequestException('Parâmetros inválidos: ' + error.message);
        }
        this.logger.error(
          `Erro ao registrar usuário (serviço de autenticação): ${error.message}`,
          error.stack
        );
      }
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erro ao registrar usuário (serviço de autenticação)'
      );
    }
  }

  /**
   * Confirma o e-mail de um usuário no Cognito.
   * @param data Email, username e código de confirmação
   * @returns Mensagem de sucesso
   */
  async confirmEmail(data: ConfirmEmailData) {
    try {
      // Sempre resolvemos o username real pelo email, pois no signup usamos um username gerado
      // (candidate) que pode ser diferente do próprio email. Isso garante que o mesmo Username
      // usado no SignUp seja utilizado na confirmação, evitando erros de código inválido/expirado
      // quando, na verdade, o problema é apenas identificar o usuário errado no Cognito.
      if (data.email) {
        const resolvedUsername = await this.authRepository.getUsernameByEmail(data.email);
        if (resolvedUsername) {
          data = { ...data, username: resolvedUsername };
        }
      }

      // Confirma o email no Cognito usando o código fornecido
      // O Cognito automaticamente:
      // - Muda o status do usuário de "UNCONFIRMED" para "CONFIRMED"
      // - Marca o email como verificado (email_verified = true)
      // - Permite que o usuário faça login
      await this.authRepository.confirmEmail(data);

      this.logger.log(`Email confirmado com sucesso para usuário: ${data.username || data.email}`);

      return {
        success: true,
        message: 'Email confirmado com sucesso! Você já pode fazer login.',
      };
    } catch (error: unknown) {
      const err = error as Error;
      if (err.name === 'CodeMismatchException') {
        throw new BadRequestException('Código de confirmação inválido');
      }
      if (err.name === 'ExpiredCodeException') {
        throw new BadRequestException('Código de confirmação expirado');
      }
      if (err.name === 'NotAuthorizedException') {
        throw new UnauthorizedException('Não autorizado');
      }
      throw new InternalServerErrorException('Erro ao confirmar email');
    }
  }

  /**
   * Renova tokens de sessão no Cognito.
   * @param data Refresh token vigente
   * @returns Novos tokens e metadados de sessão
   */
  async refreshToken(data: RefreshTokenData): Promise<RefreshTokenResponse> {
    try {
      const response = await this.authRepository.refreshToken(data);

      if (!response.AuthenticationResult) {
        throw new UnauthorizedException('Falha ao renovar token');
      }

      const { AccessToken, RefreshToken, ExpiresIn, IdToken } = response.AuthenticationResult;

      return {
        accessToken: AccessToken!,
        refreshToken: RefreshToken!,
        expiresIn: ExpiresIn!,
        idToken: IdToken!,
        tokenType: 'Bearer',
      };
    } catch (error: unknown) {
      const err = error as Error;
      if (err.name === 'NotAuthorizedException') {
        throw new UnauthorizedException(
          'Refresh token inválido (serviço de autenticação)'
        );
      }
      throw new InternalServerErrorException(
        'Erro ao renovar token de autenticação (refreshToken, serviço de autenticação)'
      );
    }
  }

  /**
   * Inicia fluxo de recuperação de senha no Cognito.
   *
   * Segundo a documentação do AWS Cognito:
   * - Só envia código se o usuário tiver pelo menos um método de contato verificado (email ou telefone)
   * - O código é válido por 24 horas
   * - Não envia código para usuários não confirmados ou desabilitados
   *
   * @param data Email do usuário
   * @returns Instrução de envio de código ao e-mail
   */
  async forgotPassword(data: ForgotPasswordData) {
    try {
      await this.authRepository.forgotPassword(data);

      return {
        success: true,
        message:
          'Se o email estiver cadastrado e verificado, você receberá um código de recuperação em instantes.',
      };
    } catch (error: unknown) {
      const err = error as Error;

      // Para segurança, não revelamos se o email existe ou não
      if (err.name === 'UserNotFoundException' || err.name === 'InvalidParameterException') {
        // Retorna sucesso mesmo se usuário não encontrado (proteção contra enumeração de emails)
        this.logger.warn(
          `Tentativa de recuperação de senha para email não encontrado: ${data.email}`
        );
        return {
          success: true,
          message:
            'Se o email estiver cadastrado e verificado, você receberá um código de recuperação em instantes.',
        };
      }

      if (err.name === 'LimitExceededException') {
        throw new BadRequestException(
          'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.'
        );
      }

      this.logger.error(`Erro ao solicitar recuperação de senha: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Erro ao solicitar recuperação de senha');
    }
  }

  /**
   * Finaliza fluxo de reset de senha com código + nova senha.
   *
   * Segundo a documentação do AWS Cognito:
   * - O código é válido por 24 horas
   * - Só funciona se o email/telefone estiver verificado
   * - Após reset bem-sucedido, o usuário pode fazer login imediatamente
   *
   * @param data Email, código e nova senha
   * @returns Mensagem de sucesso
   */
  async resetPassword(data: ResetPasswordData) {
    try {
      await this.authRepository.resetPassword(data);

      this.logger.log(`Senha redefinida com sucesso para: ${data.email}`);

      return {
        success: true,
        message: 'Senha alterada com sucesso! Você já pode fazer login com sua nova senha.',
      };
    } catch (error: unknown) {
      const err = error as Error;

      if (err.name === 'CodeMismatchException') {
        throw new BadRequestException(
          'Código de verificação inválido. Verifique o código recebido por email e tente novamente.'
        );
      }

      if (err.name === 'ExpiredCodeException') {
        throw new BadRequestException(
          'Código de verificação expirado. Solicite um novo código de recuperação.'
        );
      }

      if (err.name === 'InvalidPasswordException') {
        throw new BadRequestException(
          'A nova senha não atende aos requisitos de segurança. ' +
            'Ela deve ter no mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.'
        );
      }

      if (err.name === 'UserNotFoundException') {
        throw new BadRequestException('Usuário não encontrado');
      }

      this.logger.error(`Erro ao redefinir senha: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Erro ao redefinir senha. Tente novamente.');
    }
  }

  /**
   * Reenvia código de confirmação para o usuário.
   *
   * Segundo a documentação do AWS Cognito:
   * - O código é válido por 24 horas
   * - Pode ser reenviado mesmo para usuários não confirmados
   * - Não é necessário habilitar/desabilitar o usuário
   *
   * @param email Email do usuário
   * @returns Mensagem de sucesso
   */
  async resendConfirmationCode(email: string) {
    try {
      this.logger.debug(`Reenviando código de confirmação para: ${email}`);

      // Primeiro tenta encontrar o username pelo email
      let username = await this.authRepository.getUsernameByEmail(email);

      // Se não encontrou pelo email, tenta usar o email diretamente como username
      // (o Cognito muitas vezes usa o email como username)
      if (!username) {
        this.logger.debug(`Username não encontrado pelo email, tentando usar email como username`);
        username = email;
      }

      // Verifica se o usuário já está confirmado
      const isConfirmed = await this.authRepository.isUserConfirmed(username);
      if (isConfirmed) {
        throw new BadRequestException(
          'Este usuário já foi confirmado. Você pode fazer login normalmente.'
        );
      }

      // Tenta primeiro com o método normal (ResendConfirmationCode)
      try {
        await this.authRepository.resendConfirmationCode(username);
      } catch (firstError) {
        const firstErr = firstError as Error & { fullName?: string };

        // Se falhou com "Auto verification not turned on", informa que o código já foi enviado
        if (
          firstErr.name === 'NotAuthorizedException' &&
          firstErr.message?.includes('Auto verification not turned on')
        ) {
          // Quando auto-verification está desligado, o código já foi enviado no SignUp
          // Não podemos reenviar via API, mas o código já foi enviado
          this.logger.warn(
            `Não é possível reenviar código via API (auto-verification desligado). ` +
              `O código já foi enviado durante o registro.`
          );

          throw new BadRequestException(
            'O código de confirmação já foi enviado para seu email durante o cadastro. ' +
              'Verifique sua caixa de entrada (incluindo spam). ' +
              'Se não recebeu, aguarde alguns minutos ou entre em contato com o suporte.'
          );
        }

        // Se falhou por outro motivo e temos username diferente, tenta com email
        if (
          username !== email &&
          (firstErr.name === 'UserNotFoundException' || firstErr.name === 'NotAuthorizedException')
        ) {
          this.logger.debug(
            `Tentativa com username falhou, tentando novamente com email como username`
          );
          try {
            await this.authRepository.resendConfirmationCode(email);
          } catch (emailError) {
            const emailErr = emailError as Error & { fullName?: string };

            // Se ainda falhar com "Auto verification", informa que o código já foi enviado
            if (
              emailErr.name === 'NotAuthorizedException' &&
              emailErr.message?.includes('Auto verification not turned on')
            ) {
              this.logger.warn(
                `Não é possível reenviar código via API (auto-verification desligado). ` +
                  `O código já foi enviado durante o registro.`
              );

              throw new BadRequestException(
                'O código de confirmação já foi enviado para seu email durante o cadastro. ' +
                  'Verifique sua caixa de entrada (incluindo spam). ' +
                  'Se não recebeu, aguarde alguns minutos ou entre em contato com o suporte.'
              );
            } else {
              throw emailError;
            }
          }
        } else {
          throw firstError;
        }
      }

      this.logger.log(`Código de confirmação reenviado com sucesso para: ${username || email}`);

      return {
        success: true,
        message: 'Código de confirmação reenviado. Verifique sua caixa de entrada.',
      };
    } catch (error: unknown) {
      const err = error as Error;

      this.logger.error(`Erro ao reenviar código para ${email}:`, {
        name: err.name,
        message: err.message,
      });

      if (err.name === 'UserNotFoundException' || err instanceof BadRequestException) {
        throw err instanceof BadRequestException
          ? err
          : new BadRequestException(
              'Usuário não encontrado com este email. Verifique se o cadastro foi concluído.'
            );
      }

      if (err.name === 'NotAuthorizedException') {
        // Verifica se é o erro de auto verification ou outro
        if (err.message?.includes('Auto verification not turned on')) {
          throw new BadRequestException(
            'Não foi possível reenviar o código devido a uma configuração do sistema. ' +
              'Entre em contato com o suporte se o problema persistir.'
          );
        }

        // Outro tipo de NotAuthorizedException
        throw new BadRequestException(
          'Não foi possível reenviar o código neste momento. ' +
            'Isso pode acontecer se o código foi enviado recentemente ou se o usuário já foi confirmado. ' +
            'Aguarde alguns minutos e tente novamente.'
        );
      }

      if (err.name === 'LimitExceededException') {
        throw new BadRequestException(
          'Muitas tentativas de reenvio. Por favor, aguarde alguns minutos antes de solicitar um novo código.'
        );
      }

      throw new InternalServerErrorException(
        `Erro ao reenviar código de confirmação: ${err.message || 'Erro desconhecido'}`
      );
    }
  }

  /**
   * Verifica disponibilidade de `username` consultando MongoDB/Cognito.
   * @param username Username desejado
   * @param excludeCognitoSub Opcional: ignora o próprio usuário
   * @returns `true` quando disponível, caso contrário `false`
   */
  async checkUsernameAvailability(username: string, excludeCognitoSub?: string): Promise<boolean> {
    try {
      this.logger.debug('Verificando disponibilidade de username', { username, excludeCognitoSub });

      // Verifica se o username é válido
      if (!username || username.trim().length < 3) {
        return false;
      }

      // Verifica no Cognito
      try {
        // Usa o método do UsersService que já verifica tanto no MongoDB quanto no Cognito
        return await this.usersService.checkNicknameAvailability(username, excludeCognitoSub);
      } catch (error: unknown) {
        const err = error as Error;
        this.logger.error(
          `Erro ao verificar disponibilidade de username: ${err.message}`,
          err.stack
        );
        throw new InternalServerErrorException('Erro ao verificar disponibilidade de username');
      }
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Erro ao verificar disponibilidade de username: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Erro ao verificar disponibilidade de username');
    }
  }

  /**
   * Verifica se um nome completo está disponível.
   * @param fullName Nome completo a ser validado
   * @returns `true` quando disponível, senão `false`
   */
  async checkNameAvailability(fullName: string): Promise<boolean> {
    try {
      this.logger.debug('Verificando disponibilidade de nome', { fullName });

      // Verifica se o nome é válido
      if (!fullName || fullName.trim().length < 3) {
        return false;
      }

      const key = fullName.trim().toLowerCase();
      const now = Date.now();
      const cached = AuthService.nameCache.get(key);
      if (cached && now - cached.ts < 30000) {
        this.logger.debug('Cache hit check-fullName', { fullName });
        return cached.available;
      }

      // Verifica no MongoDB se já existe usuário com este nome
      const isNameTaken = await this.usersService.isNameTaken(fullName.trim());
      const available = !isNameTaken;
      AuthService.nameCache.set(key, { available, ts: now });

      return available;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Erro ao verificar disponibilidade de nome: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Erro ao verificar disponibilidade de nome');
    }
  }

  /**
   * Verifica o e-mail do usuário administrativamente no Cognito.
   * Útil quando o usuário não consegue verificar o e-mail normalmente.
   *
   * @param identifier - ID do usuário no Cognito (sub), username ou email
   * @returns Objeto com `success` e `message` informativa
   * @throws InternalServerErrorException Em caso de falha no Cognito
   */
  async verifyEmailAdmin(identifier: string) {
    try {
      const { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } = await import(
        '@aws-sdk/client-cognito-identity-provider'
      );

      const client = new CognitoIdentityProviderClient({ region: env.AWS_REGION });

      let cognitoUsername: string;
      let user;

      // Tenta buscar o usuário pelo identifier (pode ser username, sub ou email)
      try {
        user = await this.authRepository.getUserByUsername(identifier);
        cognitoUsername = user.Username || identifier;
      } catch (error) {
        // Se não encontrar pelo identifier, tenta buscar por email
        const err = error as Error;
        if (err.name === 'UserNotFoundException' && identifier.includes('@')) {
          // Se o identifier é um email, busca o username pelo email
          const foundUser = await this.authRepository.getUserByEmail(identifier);
          if (!foundUser || !foundUser.Username) {
            throw new BadRequestException('Usuário não encontrado');
          }
          cognitoUsername = foundUser.Username;
          // Busca novamente para obter os atributos completos
          user = await this.authRepository.getUserByUsername(cognitoUsername);
        } else {
          throw error;
        }
      }

      // Verifica se o usuário tem email
      const emailAttribute = user.UserAttributes?.find((attr) => attr.Name === 'email');

      if (!emailAttribute || !emailAttribute.Value) {
        throw new BadRequestException('Usuário não possui e-mail cadastrado');
      }

      // 1. Verifica o e-mail (email_verified = true)
      const updateCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: env.COGNITO_USER_POOL_ID!,
        Username: cognitoUsername,
        UserAttributes: [{ Name: 'email_verified', Value: 'true' }],
      });

      await client.send(updateCommand);
      this.logger.log(
        `E-mail verificado administrativamente para usuário: ${cognitoUsername} (${emailAttribute.Value})`
      );

      // 2. Confirma o signup administrativamente (se o usuário estiver não confirmado)
      try {
        const { AdminConfirmSignUpCommand } = await import(
          '@aws-sdk/client-cognito-identity-provider'
        );
        const confirmCommand = new AdminConfirmSignUpCommand({
          UserPoolId: env.COGNITO_USER_POOL_ID!,
          Username: cognitoUsername,
        });

        await client.send(confirmCommand);
        this.logger.log(`Usuário confirmado administrativamente: ${cognitoUsername}`);

        // 3. Habilita o usuário após confirmação
        await this.authRepository.enableUser(cognitoUsername);
        this.logger.log(`Usuário habilitado após confirmação: ${cognitoUsername}`);
      } catch (confirmError) {
        // Se o usuário já estiver confirmado, apenas loga (não é erro crítico)
        const confirmErr = confirmError as Error & { fullName?: string };
        if (
          confirmErr.name === 'NotAuthorizedException' &&
          confirmErr.message?.includes('already confirmed')
        ) {
          this.logger.log(`Usuário já estava confirmado: ${cognitoUsername}`);
          // Mesmo que já confirmado, tenta habilitar
          try {
            await this.authRepository.enableUser(cognitoUsername);
            this.logger.log(`Usuário habilitado: ${cognitoUsername}`);
          } catch (enableError) {
            this.logger.warn(`Erro ao habilitar usuário: ${(enableError as Error).message}`);
          }
        } else {
          // Outros erros são logados mas não interrompem o processo
          this.logger.warn(
            `Não foi possível confirmar o usuário (pode já estar confirmado): ${confirmErr.message}`
          );
        }
      }

      return {
        success: true,
        message: 'E-mail verificado e usuário confirmado com sucesso!',
        username: cognitoUsername,
        email: emailAttribute.Value,
      };
    } catch (error: unknown) {
      const err = error as Error;
      if (err instanceof BadRequestException) {
        throw err;
      }
      this.logger.error(`Erro ao verificar e-mail administrativamente: ${err.message}`, err.stack);
      throw new InternalServerErrorException(`Erro ao verificar e-mail: ${err.message}`);
    }
  }

  /**
   * Verifica se o usuário precisa escolher um nickname
   * Abordagem simples: apenas verifica no Cognito, sem modificar banco de dados
   *
   * @param cognitoSub - ID do usuário no Cognito
   * @returns Objeto indicando se precisa escolher nickname
   * @throws NotFoundException se usuário não existir
   */
  async checkNeedsNickname(cognitoSub: string): Promise<{
    needsNickname: boolean;
    hasNickname: boolean;
    cognitoSub: string;
  }> {
    try {
      // Verificar se tem nickname no Cognito
      let hasNickname = false;
      try {
        const { CognitoIdentityProviderClient, ListUsersCommand } = await import(
          '@aws-sdk/client-cognito-identity-provider'
        );
        const client = new CognitoIdentityProviderClient({ region: env.AWS_REGION });

        const listCommand = new ListUsersCommand({
          UserPoolId: env.COGNITO_USER_POOL_ID!,
          Limit: 60,
        });

        const listResponse = await client.send(listCommand);
        if (listResponse.Users) {
          const foundUser = listResponse.Users.find((u) => {
            const sub = u.Attributes?.find((attr) => attr.Name === 'sub')?.Value;
            return sub === cognitoSub;
          });

          if (foundUser) {
            const nicknameAttr = foundUser.Attributes?.find((attr) => attr.Name === 'nickname');
            hasNickname = !!(nicknameAttr?.Value && nicknameAttr.Value.trim().length > 0);
          }
        }
      } catch (error) {
        this.logger.warn(`Erro ao buscar nickname do Cognito: ${(error as Error).message}`);
        hasNickname = false;
      }

      // Retornar status baseado apenas no Cognito
      return {
        needsNickname: !hasNickname, // Precisa se não tem nickname
        hasNickname,
        cognitoSub,
      };
    } catch (error: unknown) {
      const err = error as Error;

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(`Erro ao verificar necessidade de nickname: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Erro ao verificar necessidade de nickname');
    }
  }

  /**
   * Atualiza o nickname do usuário no Cognito e desmarca needsNickname se necessário
   *
   * @param cognitoSub - ID do usuário no Cognito
   * @param newNickname - Novo nickname desejado (apenas letras e números, 3-30 caracteres)
   * @returns Confirmação de sucesso
   * @throws BadRequestException se o nickname for inválido
   * @throws ConflictException se o nickname já estiver em uso
   * @throws InternalServerErrorException em caso de erro inesperado
   */
  async changeNickname(cognitoSub: string, newNickname: string) {
    try {
      // Validação: apenas letras e números, sem caracteres especiais ou @
      if (!newNickname || newNickname.length < 3) {
        throw new BadRequestException('Nickname deve ter pelo menos 3 caracteres');
      }

      if (newNickname.length > 30) {
        throw new BadRequestException('Nickname deve ter no máximo 30 caracteres');
      }

      // Apenas letras e números - sem @, underscore ou outros caracteres especiais
      if (!/^[a-zA-Z0-9]+$/.test(newNickname)) {
        throw new BadRequestException(
          'Nickname deve conter apenas letras e números (sem @, underscore ou outros caracteres especiais)'
        );
      }

      if (newNickname.includes('@')) {
        throw new BadRequestException('O caractere @ não é permitido no nickname');
      }

      // 1. Verificar se o novo nickname está disponível ANTES de salvar (Mongo)
      this.logger.debug(
        `[changeNickname] Verificando disponibilidade do nickname (Mongo): ${newNickname}`,
      );
      const isAvailable = await this.usersService.checkNicknameAvailability(
        newNickname,
        cognitoSub,
      );
      if (!isAvailable) {
        this.logger.warn(`Nickname ${newNickname} já está em uso por outro usuário`);
        throw new ConflictException('Este nickname já está em uso. Escolha outro.');
      }
      this.logger.debug(`[changeNickname] Nickname ${newNickname} está disponível no MongoDB`);

      // 2. Atualizar apenas no MongoDB (Prisma/Mongo é fonte da verdade do nickname)
      await this.usersService.updateUserNickname(cognitoSub, newNickname);

      this.logger.log(
        `[changeNickname] Nickname atualizado com sucesso no MongoDB para cognitoSub ${cognitoSub}`,
      );

      return { success: true, message: 'Nickname atualizado com sucesso!' };
    } catch (error: unknown) {
      const err = error as Error;

      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Erro ao alterar nickname (Mongo only) para cognitoSub ${cognitoSub}: ${err.message}`,
        err.stack,
      );
      throw new InternalServerErrorException('Erro ao alterar nickname: ' + err.message);
    }
  }

  /**
   * Decodifica um token JWT.
   * @param token Token JWT a ser decodificado
   * @returns Payload do token decodificado (`JwtPayload`)
   * @throws UnauthorizedException quando o token é inválido
   */
  private decodeToken(token: string): JwtPayload {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload) as JwtPayload;
    } catch (error) {
      this.logger.error(
        'Erro ao decodificar token',
        error instanceof Error ? error.stack : String(error)
      );
      throw new UnauthorizedException('Token inválido');
    }
  }

  /**
   * Inicia o fluxo OAuth com um provedor (Google ou GitHub)
   *
   * @param provider - Provedor OAuth ('google' ou 'github')
   * @param redirectUri - URI de callback após autenticação
   * @returns URL de autorização OAuth
   * @throws BadRequestException quando provider ou redirectUri são inválidos
   */
  async startOAuth(provider: 'google' | 'github', redirectUri: string): Promise<string> {
    if (!redirectUri) {
      throw new BadRequestException('redirect_uri é obrigatório');
    }

    if (provider !== 'google' && provider !== 'github') {
      throw new BadRequestException('Provedor OAuth inválido. Use "google" ou "github"');
    }

    try {
      // Mediar via Cognito Hosted UI
      const cognitoDomain = env.COGNITO_DOMAIN;
      const cognitoClientId = env.COGNITO_CLIENT_ID;
      if (!cognitoDomain || !cognitoClientId) {
        throw new InternalServerErrorException('COGNITO_DOMAIN/COGNITO_CLIENT_ID não configurados');
      }

      const domain = cognitoDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const identityProvider = provider === 'google' ? 'Google' : 'GitHub';

      // Encode state com provider e nonce para validação posterior
      const statePayload = {
        p: provider,
        n: this.generateRandomState(),
        ts: Date.now(),
      };
      const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

      const params = new URLSearchParams({
        client_id: cognitoClientId,
        response_type: 'code',
        scope: 'openid email profile',
        redirect_uri: redirectUri,
        identity_provider: identityProvider,
        state,
      });

      return `https://${domain}/oauth2/authorize?${params.toString()}`;
    } catch (error: unknown) {
      const err = error as Error;
      if (err instanceof BadRequestException || err instanceof InternalServerErrorException) {
        throw err;
      }
      this.logger.error(`Erro ao iniciar OAuth ${provider}: ${err.message}`, err.stack);
      throw new InternalServerErrorException(`Erro ao iniciar autenticação OAuth: ${err.message}`);
    }
  }

  /**
   * Processa o callback OAuth e autentica o usuário
   *
   * @param provider - Provedor OAuth ('google' ou 'github')
   * @param code - Código de autorização recebido do provedor
   * @returns Tokens de autenticação e dados do usuário
   * @throws UnauthorizedException quando a autenticação falha
   */
  async handleOAuthCallback(
    provider: 'google' | 'github',
    code: string,
    state?: string,
    redirectUriOverride?: string
  ): Promise<LoginResponse> {
    this.logger.debug('[AuthService] handleOAuthCallback iniciado');
    this.logger.debug(
      `Provider: ${provider}, Code presente: ${!!code}, RedirectUri: ${redirectUriOverride}`
    );

    if (!code) {
      this.logger.error('[AuthService] Erro: Código ausente');
      throw new BadRequestException('Código de autorização é obrigatório');
    }

    // Verificar se código já está sendo processado ou foi processado recentemente
    const codeData = this.processedCodes.get(code);

    if (codeData?.processing) {
      this.logger.warn(
        '[AuthService] ⚠️  Código já está sendo processado, ignorando requisição duplicada'
      );
      throw new BadRequestException(
        'Código já está sendo processado. Aguarde a primeira requisição completar.'
      );
    }

    if (codeData && Date.now() - codeData.timestamp < 60000) {
      this.logger.warn('[AuthService] ⚠️  Código já foi usado recentemente');
      throw new BadRequestException(
        'Código de autorização já foi usado. Por favor, faça login novamente.'
      );
    }

    // Marcar código como "em processamento"
    this.processedCodes.set(code, { timestamp: Date.now(), processing: true });
    this.logger.debug('[AuthService] ✅ Código marcado como em processamento');

    try {
      // Validar/decodificar state (se presente) para conferir provider
      if (state) {
        try {
          const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as {
            p?: string;
          };
          if (decoded?.p && decoded.p !== provider) {
            this.logger.warn(`State provider mismatch: expected=${decoded.p} got=${provider}`);
          }
        } catch {
          this.logger.warn('Falha ao decodificar state no callback OAuth');
        }
      }

      // Mediar via Cognito: trocar code por tokens no endpoint do Cognito
      this.logger.debug('[AuthService] Trocando código por tokens no Cognito...');
      const cognitoTokens = await this.exchangeCognitoCode(code, redirectUriOverride);
      this.logger.debug('[AuthService] ✅ Tokens recebidos do Cognito');

      const idToken = cognitoTokens.id_token;
      if (!idToken) {
        this.logger.error('[AuthService] Erro: ID Token ausente nos tokens do Cognito');
        throw new UnauthorizedException('Token de autenticação inválido');
      }

      this.logger.debug('[AuthService] Decodificando ID token...');
      const payload = this.decodeToken(idToken) as JwtPayload;
      this.logger.debug(
        `[AuthService] Payload: sub=${payload.sub}, email=${payload.email}, name=${payload.name || payload.fullName}`
      );

      // Buscar/criar usuário no MongoDB
      this.logger.debug('[AuthService] Buscando usuário no MongoDB...');
      let user = await this.usersService.getUserByCognitoSub(payload.sub);

      if (!user) {
        this.logger.debug('[AuthService] Usuário não existe, criando...');
        const email =
          payload.email || `${payload.sub.replace(/[^a-zA-Z0-9]/g, '')}@temporary.email`;
        let fullName = payload.fullName || payload.name || 'Usuário';

        // Verificar se já existe usuário com mesmo fullName
        // Se existir, adicionar sufixo único baseado no email ou sub
        const nameTaken = await this.usersService.isNameTaken(fullName);
        if (nameTaken) {
          this.logger.warn(`[AuthService] Nome "${fullName}" já existe, gerando nome único...`);
          // Gerar nome único usando parte do email ou timestamp
          const emailPrefix = email.split('@')[0] || 'user';
          const subSuffix = payload.sub.substring(0, 8);
          fullName = `${fullName} (${emailPrefix}-${subSuffix})`;
          this.logger.debug(`[AuthService] Novo nome gerado: "${fullName}"`);
        }

        try {
          const nickname = this.generateNicknameFromFullNameOrSub(fullName, payload.sub);

          await this.usersService.createUser({
            cognitoSub: payload.sub,
            fullName,
            nickname,
            email,
          });

          this.logger.log('[AuthService] ✅ Usuário criado');
          user = await this.usersService.getUserByCognitoSub(payload.sub);
        } catch (error: unknown) {
          const err = error as Error;
          // Se ainda der erro de nome duplicado (race condition), tentar buscar novamente
          if (err.message?.includes('Já existe usuário com este nome')) {
            this.logger.warn(
              '[AuthService] Erro de nome duplicado, tentando buscar usuário existente...'
            );
            // Tentar buscar por email ou criar com nome mais único
            const timestamp = Date.now().toString().slice(-6);
            fullName = `${fullName} (${timestamp})`;

            try {
              await this.usersService.createUser({
                cognitoSub: payload.sub,
                fullName,
                email,
              });
              user = await this.usersService.getUserByCognitoSub(payload.sub);
            } catch (retryError) {
              this.logger.error('[AuthService] Erro ao criar usuário após retry:', retryError);
              throw retryError;
            }
          } else {
            throw error;
          }
        }
      } else {
        this.logger.debug(`[AuthService] ✅ Usuário encontrado: ${user.email}`);
      }

      // Verificar se precisa criar nickname automaticamente (apenas para login social)
      let needsNickname = false;
      let autoGeneratedNickname: string | null = null;

      try {
        const { CognitoIdentityProviderClient, ListUsersCommand, AdminGetUserCommand } =
          await import('@aws-sdk/client-cognito-identity-provider');
        const client = new CognitoIdentityProviderClient({ region: env.AWS_REGION });

        // Buscar usuário diretamente pelo sub (mais eficiente)
        const getUserCommand = new AdminGetUserCommand({
          UserPoolId: env.COGNITO_USER_POOL_ID!,
          Username: payload.sub,
        });

        try {
          const userResponse = await client.send(getUserCommand);

          if (userResponse.UserAttributes) {
            const nicknameAttr = userResponse.UserAttributes.find(
              (attr) => attr.Name === 'nickname'
            );
            const hasNickname = !!(nicknameAttr?.Value && nicknameAttr.Value.trim().length > 0);
            needsNickname = !hasNickname;

            this.logger.debug(
              `[AuthService] Verificação de nickname: hasNickname=${hasNickname}, needsNickname=${needsNickname}`
            );

            // Se não tem nickname, gerar automaticamente
            if (needsNickname && user) {
              const fullName = user.fullName || payload.name || payload.fullName || 'Usuario';

              // Gerar nickname: "nomesobrenome" (apenas letras e números)
              const generateNickname = (name: string): string => {
                const parts = name.trim().split(/\s+/).filter(Boolean);
                if (parts.length === 0) return 'usuario';

                const normalize = (str: string) =>
                  str
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-zA-Z0-9]/g, '')
                    .toLowerCase();

                const firstName = normalize(parts[0]);
                const lastName = parts.length > 1 ? normalize(parts[parts.length - 1]) : '';

                let nickname = firstName;
                if (lastName && lastName !== firstName) {
                  nickname = `${firstName}${lastName}`;
                }

                // Limita a 30 caracteres e garante mínimo de 3
                nickname = nickname.substring(0, 30);
                if (nickname.length < 3) {
                  nickname = nickname.padEnd(3, '0');
                }

                return nickname || 'usuario';
              };

              autoGeneratedNickname = generateNickname(fullName);
              this.logger.debug(
                `[AuthService] Nickname gerado automaticamente: ${autoGeneratedNickname}`
              );

              // Verificar disponibilidade antes de criar
              const isAvailable = await this.checkNicknameAvailability(
                autoGeneratedNickname,
                payload.sub
              );
              if (!isAvailable) {
                // Se não disponível, adicionar sufixo único
                const suffix = payload.sub.substring(0, 8);
                autoGeneratedNickname = `${autoGeneratedNickname}${suffix}`.substring(0, 30);
                this.logger.debug(
                  `[AuthService] Nickname ajustado (não disponível): ${autoGeneratedNickname}`
                );
              }

              // Criar nickname automaticamente no Cognito
              try {
                const username = await this.authRepository.getUsernameBySub(payload.sub);
                if (username) {
                  const { AdminUpdateUserAttributesCommand } = await import(
                    '@aws-sdk/client-cognito-identity-provider'
                  );
                  const updateCommand = new AdminUpdateUserAttributesCommand({
                    UserPoolId: env.COGNITO_USER_POOL_ID!,
                    Username: username,
                    UserAttributes: [{ Name: 'nickname', Value: autoGeneratedNickname }],
                  });

                  await client.send(updateCommand);
                  this.logger.log(
                    `[AuthService] ✅ Nickname criado automaticamente: ${autoGeneratedNickname}`
                  );
                  needsNickname = false; // Já foi criado
                }
              } catch (updateError) {
                this.logger.warn(
                  `[AuthService] Erro ao criar nickname automaticamente: ${(updateError as Error).message}`
                );
                // Continua com needsNickname=true para o frontend criar
              }
            }
          }
        } catch (getUserError) {
          // Se não conseguir buscar, tenta método alternativo
          this.logger.warn(
            `[AuthService] Erro ao buscar usuário diretamente, tentando ListUsers: ${(getUserError as Error).message}`
          );

          const listCommand = new ListUsersCommand({
            UserPoolId: env.COGNITO_USER_POOL_ID!,
            Limit: 60,
          });

          const listResponse = await client.send(listCommand);
          if (listResponse.Users) {
            const foundUser = listResponse.Users.find((u) => {
              const sub = u.Attributes?.find((attr) => attr.Name === 'sub')?.Value;
              return sub === payload.sub;
            });

            if (foundUser) {
              const nicknameAttr = foundUser.Attributes?.find((attr) => attr.Name === 'nickname');
              const hasNickname = !!(nicknameAttr?.Value && nicknameAttr.Value.trim().length > 0);
              needsNickname = !hasNickname;
            } else {
              needsNickname = true; // Não encontrou, assume que precisa
            }
          }
        }
      } catch (error) {
        this.logger.warn(
          `[AuthService] Erro ao verificar nickname no OAuth: ${(error as Error).message}`
        );
        needsNickname = true; // Em caso de erro, assume que precisa (seguro)
      }

      if (!user) {
        throw new InternalServerErrorException('Erro ao buscar ou criar usuário');
      }

      const result = {
        tokens: {
          accessToken: cognitoTokens.access_token!,
          refreshToken: cognitoTokens.refresh_token!,
          idToken: idToken,
          tokenType: cognitoTokens.token_type || 'Bearer',
          expiresIn: cognitoTokens.expires_in || 3600,
        },
        user: {
          id: user.id,
          cognitoSub: user.cognitoSub || payload.sub,
          fullName: user.fullName,
          email: payload.email || '',
          avatar: user.avatar,
          bio: user.bio,
          website: user.website,
          socialLinks: user.socialLinks,
          role: user.role, // UserRole sempre existe no User
          isActive: user.isActive,
          isBanned: user.isBanned,
          postsCount: user.postsCount,
          commentsCount: user.commentsCount,
          needsNickname, // Inclui flag indicando se precisa escolher nickname
        },
      };

      // Marcar código como processado com sucesso (não mais "em processamento")
      this.processedCodes.set(code, { timestamp: Date.now(), processing: false });
      this.logger.log('[AuthService] ✅ Callback OAuth processado com sucesso!');

      return result;
    } catch (error: unknown) {
      // Remover código do cache em caso de erro para permitir retry
      this.processedCodes.delete(code);
      this.logger.log(
        '[AuthService] ❌ Erro no callback, código removido do cache para permitir retry'
      );

      const err = error as Error & { name?: string };
      
      // Tratar erros específicos do Cognito
      if (err.name === 'InvalidParameterException') {
        throw new BadRequestException(
          'Parâmetros inválidos na requisição OAuth. Verifique a configuração.'
        );
      }
      if (err.name === 'NotAuthorizedException') {
        throw new UnauthorizedException(
          'Não autorizado. Verifique se o código de autorização está correto e não expirou.'
        );
      }
      if (err.message?.includes('invalid_grant') || err.message?.includes('authorization code')) {
        throw new BadRequestException(
          'Código de autorização inválido ou expirado. Tente fazer login novamente.'
        );
      }
      
      // Re-lançar erros já tratados
      if (err instanceof BadRequestException || err instanceof UnauthorizedException || err instanceof InternalServerErrorException) {
        throw err;
      }
      
      this.logger.error(`Erro ao processar callback OAuth ${provider}: ${err.message}`, err.stack);
      throw new InternalServerErrorException(
        `Erro ao processar autenticação OAuth: ${err.message || 'Erro desconhecido'}`
      );
    }
  }

  /**
   * Troca code por tokens diretamente no Cognito Hosted UI
   */
  private async exchangeCognitoCode(
    code: string,
    redirectUriOverride?: string
  ): Promise<{
    access_token: string;
    refresh_token?: string;
    id_token: string;
    token_type?: string;
    expires_in?: number;
  }> {
    const domain = env.COGNITO_DOMAIN;
    const clientId = env.COGNITO_CLIENT_ID;
    const clientSecret = env.COGNITO_CLIENT_SECRET;
    const redirectUri = redirectUriOverride || env.OAUTH_REDIRECT_SIGN_IN;

    if (!domain || !clientId || !redirectUri) {
      throw new InternalServerErrorException(
        'Configuração Cognito incompleta (COGNITO_DOMAIN/CLIENT_ID/OAUTH_REDIRECT_SIGN_IN)'
      );
    }

    const tokenUrl = `https://${domain.replace(/^https?:\/\//, '').replace(/\/$/, '')}/oauth2/token`;
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    // Se houver client secret, usa Authorization Basic
    if (clientSecret) {
      const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${basic}`;
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers,
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Erro Cognito token exchange: ${response.status} - ${errorText}`);
      
      try {
        const errorData = JSON.parse(errorText) as { error?: string; error_description?: string };
        const errorCode = errorData.error;
        const errorDescription = errorData.error_description;
        
        if (errorCode === 'invalid_grant') {
          throw new BadRequestException(
            errorDescription || 'Código de autorização inválido ou expirado. Tente fazer login novamente.'
          );
        }
        if (errorCode === 'invalid_client') {
          throw new InternalServerErrorException(
            'Erro de configuração do cliente OAuth. Verifique as credenciais do Cognito.'
          );
        }
        if (errorCode === 'unauthorized_client') {
          throw new BadRequestException(
            'Cliente não autorizado. Verifique a configuração do App Client no Cognito.'
          );
        }
        
        // Erro genérico com descrição se disponível
        throw new BadRequestException(
          errorDescription || 'Erro ao processar código de autorização. Tente fazer login novamente.'
        );
      } catch (parseError) {
        // Se não conseguir parsear, usar mensagem genérica
        if (parseError instanceof BadRequestException || parseError instanceof InternalServerErrorException) {
          throw parseError;
        }
        throw new BadRequestException('Código de autorização inválido ou expirado. Tente fazer login novamente.');
      }
    }

    const data = (await response.json()) as {
      id_token?: string;
      access_token?: string;
      refresh_token?: string;
      token_type?: string;
      expires_in?: number;
    };
    if (!data.id_token || !data.access_token) {
      throw new BadRequestException('Resposta inválida do Cognito');
    }
    return {
      access_token: data.access_token,
      id_token: data.id_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
    };
  }

  /**
   * Gera um state aleatório para proteção CSRF
   */
  private generateRandomState(): string {
    return Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64url');
  }

  /**
   * Gera uma senha temporária segura para autenticação passwordless
   * A senha será usada apenas uma vez após verificar o código
   */
  private generateTemporaryPassword(): string {
    // Gerar senha aleatória segura: 32 caracteres alfanuméricos + símbolos
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 32; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Inicia autenticação passwordless usando fluxo nativo ForgotPassword do Cognito
   * O Cognito envia código de verificação por email nativamente (sem Lambda triggers)
   *
   * @param data Email do usuário
   * @returns Resposta com status de envio
   */
  async initiatePasswordlessLogin(
    data: PasswordlessLoginInitData
  ): Promise<PasswordlessLoginInitResponse> {
    try {
      this.logger.debug(`[Passwordless] Iniciando autenticação para: ${data.email}`);

      // Verificar se o usuário existe no Cognito
      const userExists = await this.authRepository.userExistsByEmail(data.email);

      if (!userExists) {
        // Por segurança, não revelar se o usuário existe ou não
        // Retornar sucesso mesmo se não existir
        this.logger.warn(
          `[Passwordless] Tentativa de login para email não cadastrado: ${data.email}`
        );
        return {
          success: true,
          message: 'Se o email estiver cadastrado, você receberá um código de verificação.',
        };
      }

      // Usar fluxo nativo ForgotPassword do Cognito
      // O Cognito envia código de verificação por email automaticamente (sem Lambda)
      try {
        this.logger.debug(`[Passwordless] Usando fluxo nativo ForgotPassword do Cognito...`);
        await this.authRepository.forgotPassword({ email: data.email });

        this.logger.log(
          `[Passwordless] ✅ Código de verificação enviado por email via Cognito (método nativo)`
        );

        return {
          success: true,
          message: 'Código de verificação enviado para seu email.',
        };
      } catch (cognitoError: unknown) {
        const err = cognitoError as Error & { name: string };
        this.logger.error(
          `[Passwordless] Erro ao iniciar ForgotPassword: ${err.name} - ${err.message}`
        );

        // Se o erro for que o usuário não existe, não revelar
        if (err.name === 'UserNotFoundException') {
          this.logger.warn(`[Passwordless] Usuário não encontrado: ${data.email}`);
          return {
            success: true,
            message: 'Se o email estiver cadastrado, você receberá um código de verificação.',
          };
        }

        // Outros erros são propagados
        throw cognitoError;
      }
    } catch (error: unknown) {
      const err = error as Error;
      if (err instanceof InternalServerErrorException) {
        throw err;
      }
      this.logger.error(`[Passwordless] Erro ao iniciar login: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Erro ao enviar código de verificação');
    }
  }

  /**
   * Verifica código de autenticação passwordless e autentica o usuário
   * Usa fluxo nativo ForgotPassword do Cognito:
   * 1. Verifica código usando ConfirmForgotPassword
   * 2. Define senha temporária durante a verificação
   * 3. Autentica imediatamente com a senha temporária
   *
   * @param data Email e código de verificação
   * @returns Tokens de autenticação e dados do usuário
   */
  async verifyPasswordlessCode(
    data: PasswordlessLoginVerifyData
  ): Promise<PasswordlessLoginVerifyResponse> {
    try {
      this.logger.debug(`[Passwordless] Verificando código para: ${data.email}`);

      // Gerar senha temporária segura
      const tempPassword = this.generateTemporaryPassword();

      try {
        // 1. Verificar código e definir senha temporária usando ConfirmForgotPassword
        // O Cognito valida o código e define a nova senha
        this.logger.debug(`[Passwordless] Verificando código via ConfirmForgotPassword...`);
        await this.authRepository.resetPassword({
          email: data.email,
          code: data.code,
          newPassword: tempPassword,
        });

        this.logger.log(`[Passwordless] ✅ Código verificado com sucesso`);

        // 2. Armazenar senha temporária por alguns segundos (apenas para autenticação)
        this.passwordlessTempPasswords.set(data.email, {
          tempPassword,
          timestamp: Date.now(),
        });

        // 3. Autenticar imediatamente com a senha temporária
        this.logger.debug(`[Passwordless] Autenticando com senha temporária...`);
        const authResponse = await this.authRepository.login({
          email: data.email,
          password: tempPassword,
        });

        // Limpar senha temporária do cache após autenticação bem-sucedida
        this.passwordlessTempPasswords.delete(data.email);

        if (!authResponse.AuthenticationResult) {
          throw new InternalServerErrorException('Erro ao autenticar após verificação do código');
        }

        const { AccessToken, RefreshToken, ExpiresIn, IdToken } = authResponse.AuthenticationResult;

        if (!IdToken) {
          throw new UnauthorizedException('Token de autenticação inválido');
        }

        // Decodificar ID token para obter informações do usuário
        const payload = this.decodeToken(IdToken) as JwtPayload;

        // Buscar ou criar usuário no MongoDB
        this.logger.debug(`[Passwordless] Buscando usuário no MongoDB: cognitoSub=${payload.sub}`);
        let user = await this.usersService.getUserByCognitoSub(payload.sub);

        if (!user) {
          this.logger.debug(`[Passwordless] Usuário não encontrado, criando...`);
          const email =
            payload.email || `${payload.sub.replace(/[^a-zA-Z0-9]/g, '')}@temporary.email`;
          const fullName = (payload.name as string) || payload.fullName || 'Usuário';

          const { UserRole } = await import('../users/user.model.js');
          await this.usersService.createUser({
            cognitoSub: payload.sub,
            fullName,
            email,
            role: UserRole.SUBSCRIBER,
          });

          // Buscar novamente para garantir que temos o usuário completo
          user = await this.usersService.getUserByCognitoSub(payload.sub);
        }

        // Verificar se user foi criado corretamente
        if (!user) {
          throw new InternalServerErrorException('Erro ao buscar ou criar usuário');
        }

        this.logger.log(`[Passwordless] ✅ Autenticação passwordless concluída com sucesso`);

        // Retornar resposta no formato esperado
        return {
          tokens: {
            accessToken: AccessToken!,
            refreshToken: RefreshToken!,
            idToken: IdToken,
            tokenType: 'Bearer',
            expiresIn: ExpiresIn!,
          },
          user: {
            id: user.id,
            cognitoSub: user.cognitoSub || payload.sub,
            fullName: user.fullName,
            email: payload.email || '',
            avatar: user.avatar,
            bio: user.bio,
            website: user.website,
            socialLinks: user.socialLinks,
            role: user.role,
            isActive: user.isActive,
            isBanned: user.isBanned,
            postsCount: user.postsCount,
            commentsCount: user.commentsCount,
          },
        };
      } catch (cognitoError: unknown) {
        const err = cognitoError as Error & { name: string };
        this.logger.error(
          `[Passwordless] Erro ao verificar código: ${err.name} - ${err.message}`
        );

        // Limpar senha temporária em caso de erro
        this.passwordlessTempPasswords.delete(data.email);

        // Erros específicos do Cognito
        if (err.name === 'CodeMismatchException' || err.name === 'ExpiredCodeException') {
          throw new BadRequestException('Código incorreto ou expirado. Solicite um novo código.');
        }

        if (err.name === 'LimitExceededException') {
          throw new BadRequestException(
            'Número máximo de tentativas excedido. Solicite um novo código.'
          );
        }

        if (err.name === 'UserNotFoundException') {
          throw new UnauthorizedException('Usuário não encontrado');
        }

        if (err.name === 'NotAuthorizedException') {
          throw new BadRequestException(
            'Código incorreto ou expirado. Solicite um novo código.'
          );
        }

        // Outros erros são propagados
        throw cognitoError;
      }
    } catch (error: unknown) {
      const err = error as Error;
      if (
        err instanceof BadRequestException ||
        err instanceof UnauthorizedException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }
      this.logger.error(`[Passwordless] Erro ao verificar código: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Erro ao verificar código de autenticação');
    }
  }
}
