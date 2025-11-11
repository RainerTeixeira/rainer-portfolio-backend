/**
 * Repositório de Autenticação
 *
 * Camada de acesso a dados para autenticação via AWS Cognito.
 *
 * @module modules/auth/auth.repository
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ResendConfirmationCodeCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
  RespondToAuthChallengeCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { createHmac } from 'node:crypto';
import { cognitoConfig } from '../../config/cognito.config.js';
import { env } from '../../config/env.js';
import type {
  LoginData,
  RegisterData,
  RefreshTokenData,
  ConfirmEmailData,
  ForgotPasswordData,
  ResetPasswordData,
} from './auth.model.js';

@Injectable()
export class AuthRepository {
  private readonly cognitoClient: CognitoIdentityProviderClient;
  private readonly logger = new Logger(AuthRepository.name);

  constructor() {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: cognitoConfig.region,
    });
  }

  /**
   * Calcula SecretHash para fluxos do Cognito quando `clientSecret` existe.
   * @param username Identificador (username/email) usado no Cognito
   * @returns SecretHash em base64 ou `undefined` se não aplicável
   */
  private calculateSecretHash(username: string): string | undefined {
    if (!cognitoConfig.clientSecret) {
      return undefined;
    }

    return createHmac('sha256', cognitoConfig.clientSecret)
      .update(username + cognitoConfig.clientId)
      .digest('base64');
  }

  /**
   * Inicia fluxo de autenticação por senha no Cognito.
   * @param data Credenciais de login
   * @returns Resposta bruta do Cognito (AuthenticationResult em caso de sucesso)
   */
  async login(data: LoginData) {
    // Login aceita email, mas Cognito usa username
    // Precisamos buscar o username pelo email ou aceitar ambos
    // Por enquanto, tentamos com email (pode precisar ajustar)
    const identifier = data.email;
    const secretHash = this.calculateSecretHash(identifier);

    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: cognitoConfig.clientId,
      AuthParameters: {
        USERNAME: identifier,
        PASSWORD: data.password,
        ...(secretHash && { SECRET_HASH: secretHash }),
      },
    });

    const response = await this.cognitoClient.send(command);
    this.logger.log(`Usuário autenticado com sucesso: ${data.email}`);
    return response;
  }

  /**
   * Registra usuário no Cognito com atributos padrões.
   * @param data Dados de registro
   * @returns Resposta do Cognito (contendo `UserSub` e `UserConfirmed`)
   */
  async register(data: RegisterData) {
    // Usa o Nome Completo (formatado com _) como Username quando fornecido; fallback: email
    const identifier: string = (data as { username?: string }).username || data.email;
    const secretHash = this.calculateSecretHash(identifier);

    const command = new SignUpCommand({
      ClientId: cognitoConfig.clientId,
      Username: identifier,
      Password: data.password,
      UserAttributes: [
        { Name: 'email', Value: data.email },
        { Name: 'nickname', Value: data.nickname }, // Apenas nickname
        ...(data.phoneNumber ? [{ Name: 'phone_number', Value: data.phoneNumber }] : []),
        ...(data.avatar ? [{ Name: 'picture', Value: data.avatar }] : []),
      ],
      ...(secretHash && { SecretHash: secretHash }),
    });

    try {
      const response = await this.cognitoClient.send(command);
      this.logger.log(
        `Usuário registrado no Cognito: ${identifier} (Email: ${data.email}, UserConfirmed: ${response.UserConfirmed})`
      );
      this.logger.debug(
        `Resposta do SignUp: CodeDeliveryDetails=${JSON.stringify(response.CodeDeliveryDetails)}, UserSub=${response.UserSub}`
      );
      return response;
    } catch (error) {
      const err = error as Error & { fullName?: string };
      this.logger.error(
        `Erro ao registrar usuário ${identifier}: ${err.name} - ${err.message}`,
        err.stack
      );
      throw error;
    }
  }

  /**
   * Confirma e-mail do usuário no Cognito.
   * @param data Email/username e código de confirmação
   */
  async confirmEmail(data: ConfirmEmailData) {
    // Usa o mesmo username usado no registro; se ausente, tenta com email
    const identifier = data.username || data.email;
    const secretHash = this.calculateSecretHash(identifier);

    const command = new ConfirmSignUpCommand({
      ClientId: cognitoConfig.clientId,
      Username: identifier,
      ConfirmationCode: data.code,
      ...(secretHash && { SecretHash: secretHash }),
    });

    return await this.cognitoClient.send(command);
  }

  /**
   * Renova tokens no Cognito pelo refresh token.
   * @param data Refresh token
   */
  async refreshToken(data: RefreshTokenData) {
    const command = new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: cognitoConfig.clientId,
      AuthParameters: {
        REFRESH_TOKEN: data.refreshToken,
      },
    });

    return await this.cognitoClient.send(command);
  }

  /**
   * Solicita código de recuperação de senha ao Cognito.
   * @param data Email do usuário
   */
  async forgotPassword(data: ForgotPasswordData) {
    const secretHash = this.calculateSecretHash(data.email);

    const command = new ForgotPasswordCommand({
      ClientId: cognitoConfig.clientId,
      Username: data.email,
      ...(secretHash && { SecretHash: secretHash }),
    });

    return await this.cognitoClient.send(command);
  }

  /**
   * Confirma redefinição de senha no Cognito com código e nova senha.
   * @param data Email, código e nova senha
   */
  async resetPassword(data: ResetPasswordData) {
    const secretHash = this.calculateSecretHash(data.email);

    const command = new ConfirmForgotPasswordCommand({
      ClientId: cognitoConfig.clientId,
      Username: data.email, // Usar email como identificador
      ConfirmationCode: data.code,
      Password: data.newPassword,
      ...(secretHash && { SecretHash: secretHash }),
    });

    return await this.cognitoClient.send(command);
  }

  async resendConfirmationCode(emailOrUsername: string) {
    this.logger.debug(`Reenviando código de confirmação para: ${emailOrUsername}`);
    const secretHash = this.calculateSecretHash(emailOrUsername);

    const command = new ResendConfirmationCodeCommand({
      ClientId: cognitoConfig.clientId,
      Username: emailOrUsername,
      ...(secretHash && { SecretHash: secretHash }),
    });

    try {
      const response = await this.cognitoClient.send(command);
      this.logger.log(`Código de confirmação enviado com sucesso para: ${emailOrUsername}`);
      return response;
    } catch (error) {
      const err = error as Error & { fullName?: string };
      this.logger.error(
        `Erro ao reenviar código para ${emailOrUsername}: ${err.name} - ${err.message}`,
        err.stack
      );
      throw error;
    }
  }

  /**
   * Verifica se o usuário está confirmado.
   * @param username Username do usuário no Cognito
   * @returns true se confirmado, false caso contrário
   */
  async isUserConfirmed(username: string): Promise<boolean> {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: cognitoConfig.userPoolId,
        Username: username,
      });

      const response = await this.cognitoClient.send(command);
      return response.UserStatus === 'CONFIRMED';
    } catch (error) {
      this.logger.error(`Erro ao verificar status do usuário ${username}:`, error);
      return false;
    }
  }

  /**
   * Busca usuário no Cognito pelo username.
   * @param username Username
   * @throws Error com fullName `UserNotFoundException` quando não encontrado
   */
  async getUserByUsername(username: string) {
    const { CognitoIdentityProviderClient, AdminGetUserCommand } = await import(
      '@aws-sdk/client-cognito-identity-provider'
    );
    const client = new CognitoIdentityProviderClient({ region: env.AWS_REGION });

    try {
      const command = new AdminGetUserCommand({
        UserPoolId: env.COGNITO_USER_POOL_ID!,
        Username: username,
      });

      const response = await client.send(command);
      return response;
    } catch (error) {
      const cognitoError = error as Error & { name: string; message: string };
      // Se o erro for UserNotFoundException, relançar para ser tratado pelo serviço
      if (cognitoError.name === 'UserNotFoundException') {
        throw cognitoError;
      }
      this.logger.error(
        `Erro ao buscar usuário no Cognito: ${cognitoError.message}`,
        cognitoError.stack
      );
      throw new Error('Erro ao buscar usuário');
    }
  }

  async getUsernameByEmail(email: string): Promise<string | null> {
    const { CognitoIdentityProviderClient, ListUsersCommand } = await import(
      '@aws-sdk/client-cognito-identity-provider'
    );
    const client = new CognitoIdentityProviderClient({ region: env.AWS_REGION });

    const command = new ListUsersCommand({
      UserPoolId: env.COGNITO_USER_POOL_ID!,
      Filter: `email = "${email}"`,
      Limit: 1,
    });

    const response = await client.send(command);
    if (!response.Users || response.Users.length === 0) return null;
    // O campo Username do usuário encontrado
    return response.Users[0].Username || null;
  }

  /**
   * Busca o username do Cognito pelo cognitoSub (sub).
   * Como o ListUsersCommand não suporta filtro por sub diretamente,
   * tenta primeiro usar o sub como username, e se falhar, busca via ListUsersCommand.
   * @param cognitoSub ID do usuário no Cognito (sub)
   * @returns Username do usuário ou null se não encontrado
   */
  async getUsernameBySub(cognitoSub: string): Promise<string | null> {
    const { CognitoIdentityProviderClient, AdminGetUserCommand, ListUsersCommand } = await import(
      '@aws-sdk/client-cognito-identity-provider'
    );
    const client = new CognitoIdentityProviderClient({ region: env.AWS_REGION });

    // Primeiro tenta usar o cognitoSub como username diretamente
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: env.COGNITO_USER_POOL_ID! || cognitoConfig.userPoolId,
        Username: cognitoSub,
      });

      const response = await client.send(command);
      // Se encontrou, verifica se o sub corresponde
      const sub = response.UserAttributes?.find((attr) => attr.Name === 'sub')?.Value;
      if (sub === cognitoSub) {
        return response.Username || cognitoSub;
      }
    } catch (error) {
      // Se falhou, continua para buscar via ListUsersCommand
      this.logger.debug(
        `Não foi possível usar cognitoSub como username diretamente, buscando via ListUsersCommand`
      );
    }

    // Se não funcionou, busca via ListUsersCommand (sem filtro, já que não suporta filtro por sub)
    // Limita a busca a 60 usuários e filtra manualmente pelo sub
    try {
      const command = new ListUsersCommand({
        UserPoolId: env.COGNITO_USER_POOL_ID! || cognitoConfig.userPoolId,
        Limit: 60, // Limite máximo por página
      });

      const response = await client.send(command);
      if (!response.Users) return null;

      // Busca o usuário cujo atributo 'sub' corresponde ao cognitoSub
      const user = response.Users.find((u) => {
        const sub = u.Attributes?.find((attr) => attr.Name === 'sub')?.Value;
        return sub === cognitoSub;
      });

      return user?.Username || null;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Erro ao buscar username por sub ${cognitoSub}: ${err.message}`, err.stack);
      return null;
    }
  }

  /**
   * Busca primeiro usuário no Cognito com e-mail informado.
   * @param email E-mail do usuário
   * @returns Usuário do Cognito ou null
   */
  async getUserByEmail(email: string) {
    const { CognitoIdentityProviderClient, ListUsersCommand } = await import(
      '@aws-sdk/client-cognito-identity-provider'
    );
    const client = new CognitoIdentityProviderClient({ region: env.AWS_REGION });

    const command = new ListUsersCommand({
      UserPoolId: env.COGNITO_USER_POOL_ID!,
      Filter: `email = "${email}"`,
      Limit: 1,
    });

    const response = await client.send(command);
    return response.Users && response.Users.length > 0 ? response.Users[0] : null;
  }

  /**
   * Desabilita usuário no Cognito.
   * @param cognitoSub ID do usuário no Cognito
   */
  async disableUser(cognitoSub: string) {
    const command = new AdminDisableUserCommand({
      UserPoolId: cognitoConfig.userPoolId,
      Username: cognitoSub,
    });

    return await this.cognitoClient.send(command);
  }

  /**
   * Habilita usuário no Cognito.
   * @param username Username do usuário no Cognito
   */
  async enableUser(username: string) {
    const command = new AdminEnableUserCommand({
      UserPoolId: cognitoConfig.userPoolId,
      Username: username,
    });

    return await this.cognitoClient.send(command);
  }

  /**
   * Verifica se um usuário existe no Cognito pelo email.
   * @param email Email do usuário
   * @returns true se o usuário existe, false caso contrário
   */
  async userExistsByEmail(email: string): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);
      return user !== null;
    } catch (error) {
      this.logger.error(`Erro ao verificar existência do usuário ${email}:`, error);
      return false;
    }
  }

  /**
   * Inicia autenticação passwordless usando CUSTOM_AUTH flow.
   * Requer Lambda triggers configurados no Cognito (CreateAuthChallenge, DefineAuthChallenge).
   * @param email Email do usuário
   * @returns Resposta do Cognito com Session e ChallengeName
   */
  async initiatePasswordlessAuth(email: string) {
    const secretHash = this.calculateSecretHash(email);

    const command = new InitiateAuthCommand({
      AuthFlow: 'CUSTOM_AUTH',
      ClientId: cognitoConfig.clientId,
      AuthParameters: {
        USERNAME: email,
        ...(secretHash && { SECRET_HASH: secretHash }),
      },
    });

    try {
      const response = await this.cognitoClient.send(command);
      this.logger.log(`Autenticação passwordless iniciada para: ${email}`);
      return response;
    } catch (error) {
      const err = error as Error & { name: string };
      this.logger.error(
        `Erro ao iniciar autenticação passwordless para ${email}: ${err.name} - ${err.message}`,
        err.stack
      );
      throw error;
    }
  }

  /**
   * Verifica código de autenticação passwordless usando RespondToAuthChallenge.
   * @param email Email do usuário
   * @param code Código de verificação
   * @param session Session ID retornado na inicialização
   * @returns Tokens de autenticação
   */
  async respondToPasswordlessChallenge(
    email: string,
    code: string,
    session: string
  ) {
    const secretHash = this.calculateSecretHash(email);

    const command = new RespondToAuthChallengeCommand({
      ClientId: cognitoConfig.clientId,
      ChallengeName: 'CUSTOM_CHALLENGE',
      Session: session,
      ChallengeResponses: {
        USERNAME: email,
        ANSWER: code,
        ...(secretHash && { SECRET_HASH: secretHash }),
      },
    });

    try {
      const response = await this.cognitoClient.send(command);
      this.logger.log(`Código passwordless verificado para: ${email}`);
      return response;
    } catch (error) {
      const err = error as Error & { name: string };
      this.logger.error(
        `Erro ao verificar código passwordless para ${email}: ${err.name} - ${err.message}`,
        err.stack
      );
      throw error;
    }
  }

  /**
   * Inicia autenticação passwordless usando AdminInitiateAuth (requer permissões admin).
   * Alternativa quando Lambda triggers não estão configurados.
   * @param email Email do usuário
   * @returns Resposta do Cognito com Session
   */
  async adminInitiatePasswordlessAuth(email: string) {
    const secretHash = this.calculateSecretHash(email);

    const command = new AdminInitiateAuthCommand({
      UserPoolId: cognitoConfig.userPoolId,
      ClientId: cognitoConfig.clientId,
      AuthFlow: 'CUSTOM_AUTH',
      AuthParameters: {
        USERNAME: email,
        ...(secretHash && { SECRET_HASH: secretHash }),
      },
    });

    try {
      const response = await this.cognitoClient.send(command);
      this.logger.log(`Autenticação passwordless admin iniciada para: ${email}`);
      return response;
    } catch (error) {
      const err = error as Error & { name: string };
      this.logger.error(
        `Erro ao iniciar autenticação passwordless admin para ${email}: ${err.name} - ${err.message}`,
        err.stack
      );
      throw error;
    }
  }

  /**
   * Responde ao desafio passwordless usando AdminRespondToAuthChallenge (requer permissões admin).
   * @param email Email do usuário
   * @param code Código de verificação
   * @param session Session ID retornado na inicialização
   * @returns Tokens de autenticação
   */
  async adminRespondToPasswordlessChallenge(
    email: string,
    code: string,
    session: string
  ) {
    const secretHash = this.calculateSecretHash(email);

    const command = new AdminRespondToAuthChallengeCommand({
      UserPoolId: cognitoConfig.userPoolId,
      ClientId: cognitoConfig.clientId,
      ChallengeName: 'CUSTOM_CHALLENGE',
      Session: session,
      ChallengeResponses: {
        USERNAME: email,
        ANSWER: code,
        ...(secretHash && { SECRET_HASH: secretHash }),
      },
    });

    try {
      const response = await this.cognitoClient.send(command);
      this.logger.log(`Código passwordless admin verificado para: ${email}`);
      return response;
    } catch (error) {
      const err = error as Error & { name: string };
      this.logger.error(
        `Erro ao verificar código passwordless admin para ${email}: ${err.name} - ${err.message}`,
        err.stack
      );
      throw error;
    }
  }
}
