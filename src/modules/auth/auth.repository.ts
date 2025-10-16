/**
 * Repository de Autenticação
 * 
 * Camada de acesso a dados para autenticação via AWS Cognito.
 * 
 * @module modules/auth/auth.repository
 */

import { Injectable } from '@nestjs/common';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { createHmac } from 'crypto';
import { cognitoConfig } from '../../config/cognito.config.js';
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

  constructor() {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: cognitoConfig.region,
    });
  }

  private calculateSecretHash(username: string): string | undefined {
    if (!cognitoConfig.clientSecret) {
      return undefined;
    }

    return createHmac('sha256', cognitoConfig.clientSecret)
      .update(username + cognitoConfig.clientId)
      .digest('base64');
  }

  async login(data: LoginData) {
    const secretHash = this.calculateSecretHash(data.email);

    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: cognitoConfig.clientId,
      AuthParameters: {
        USERNAME: data.email,
        PASSWORD: data.password,
        ...(secretHash && { SECRET_HASH: secretHash }),
      },
    });

    return await this.cognitoClient.send(command);
  }

  async register(data: RegisterData) {
    const secretHash = this.calculateSecretHash(data.email);

    const command = new SignUpCommand({
      ClientId: cognitoConfig.clientId,
      Username: data.email,
      Password: data.password,
      UserAttributes: [
        { Name: 'email', Value: data.email },
        { Name: 'name', Value: data.name },
        { Name: 'preferred_username', Value: data.username },
        ...(data.phoneNumber ? [{ Name: 'phone_number', Value: data.phoneNumber }] : []),
        ...(data.avatar ? [{ Name: 'picture', Value: data.avatar }] : []),
      ],
      ...(secretHash && { SecretHash: secretHash }),
    });

    return await this.cognitoClient.send(command);
  }

  async confirmEmail(data: ConfirmEmailData) {
    const secretHash = this.calculateSecretHash(data.email);

    const command = new ConfirmSignUpCommand({
      ClientId: cognitoConfig.clientId,
      Username: data.email,
      ConfirmationCode: data.code,
      ...(secretHash && { SecretHash: secretHash }),
    });

    return await this.cognitoClient.send(command);
  }

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

  async forgotPassword(data: ForgotPasswordData) {
    const secretHash = this.calculateSecretHash(data.email);

    const command = new ForgotPasswordCommand({
      ClientId: cognitoConfig.clientId,
      Username: data.email,
      ...(secretHash && { SecretHash: secretHash }),
    });

    return await this.cognitoClient.send(command);
  }

  async resetPassword(data: ResetPasswordData) {
    const secretHash = this.calculateSecretHash(data.email);

    const command = new ConfirmForgotPasswordCommand({
      ClientId: cognitoConfig.clientId,
      Username: data.email,
      ConfirmationCode: data.code,
      Password: data.newPassword,
      ...(secretHash && { SecretHash: secretHash }),
    });

    return await this.cognitoClient.send(command);
  }
}

