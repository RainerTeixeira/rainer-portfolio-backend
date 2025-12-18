import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CognitoIdentityProviderClient, 
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
  AdminCreateUserCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ChallengeNameType } from '@aws-sdk/client-cognito-identity-provider';
import { USERS_REPOSITORY_TOKEN } from '../../database/tokens';
import { IUsersRepository } from '../../../database/interfaces/users.repository.interface';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly cognitoClient: CognitoIdentityProviderClient;
  private readonly userPoolId: string;
  private readonly clientId: string;

  constructor(
    private configService: ConfigService,
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly usersRepository: IUsersRepository,
    private readonly jwtService: JwtService,
  ) {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
    });

    this.userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID') || '';
    this.clientId = this.configService.get<string>('COGNITO_CLIENT_ID') || '';
  }

  /**
   * Realiza login do usuário
   */
  async login(loginDto: LoginDto) {
    try {
      const command = new AdminInitiateAuthCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthFlow: 'ADMIN_NO_SRP_AUTH',
        AuthParameters: {
          USERNAME: loginDto.email,
          PASSWORD: loginDto.password,
        },
      });

      const response = await this.cognitoClient.send(command);

      // Se precisa de novo desafio (ex: senha temporária)
      if (response.ChallengeName) {
        return {
          challengeName: response.ChallengeName,
          session: response.Session,
        };
      }

      // Busca/atualiza usuário no DynamoDB
      const cognitoUser = await this.getCognitoUser(loginDto.email);
      if (cognitoUser) {
        await this.findOrCreateUser(cognitoUser);
        await this.usersRepository.updateLastLogin(cognitoUser.sub);
      }

      return {
        accessToken: response.AuthenticationResult?.AccessToken,
        idToken: response.AuthenticationResult?.IdToken,
        refreshToken: response.AuthenticationResult?.RefreshToken,
        expiresIn: response.AuthenticationResult?.ExpiresIn,
        tokenType: response.AuthenticationResult?.TokenType,
      };
    } catch (error: any) {
      this.handleCognitoError(error);
      throw error; // Adiciona throw para satisfazer o TypeScript
    }
  }

  /**
   * Responde a desafio de autenticação
   */
  async respondToAuthChallenge(challengeName: string, session: string, responses: any) {
    try {
      const command = new AdminRespondToAuthChallengeCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        ChallengeName: challengeName as ChallengeNameType,
        Session: session,
        ChallengeResponses: responses,
      });

      const result = await this.cognitoClient.send(command);

      return {
        accessToken: result.AuthenticationResult?.AccessToken,
        idToken: result.AuthenticationResult?.IdToken,
        refreshToken: result.AuthenticationResult?.RefreshToken,
        expiresIn: result.AuthenticationResult?.ExpiresIn,
      };
    } catch (error: any) {
      this.handleCognitoError(error);
      throw error; // Adiciona throw para satisfazer o TypeScript
    }
  }

  /**
   * Registra novo usuário
   */
  async signup(signupDto: SignupDto) {
    try {
      // 1. Cria usuário no Cognito
      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: signupDto.email,
        UserAttributes: [
          { Name: 'email', Value: signupDto.email },
          { Name: 'name', Value: signupDto.fullName || '' },
          { Name: 'nickname', Value: signupDto.nickname || signupDto.email.split('@')[0] },
          { Name: 'email_verified', Value: 'true' },
        ],
        MessageAction: 'SUPPRESS', // Não envia email de convite
        TemporaryPassword: signupDto.password,
      });

      await this.cognitoClient.send(createUserCommand);

      // 2. Define senha permanente
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: signupDto.email,
        Password: signupDto.password,
        Permanent: true,
      });

      await this.cognitoClient.send(setPasswordCommand);

      // 3. Cria usuário no DynamoDB
      const cognitoUser = await this.getCognitoUser(signupDto.email);
      if (cognitoUser) {
        await this.findOrCreateUser(cognitoUser);
      }

      return {
        message: 'User created successfully',
        user: cognitoUser,
      };
    } catch (error: any) {
      this.handleCognitoError(error);
      throw error; // Adiciona throw para satisfazer o TypeScript
    }
  }

  /**
   * Confirma cadastro do usuário
   */
  async confirmSignUp(email: string, code: string) {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: code,
      });

      await this.cognitoClient.send(command);

      return { message: 'User confirmed successfully' };
    } catch (error: any) {
      this.handleCognitoError(error);
      throw error; // Adiciona throw para satisfazer o TypeScript
    }
  }

  /**
   * Esqueci a senha
   */
  async forgotPassword(email: string) {
    try {
      const command = new ForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
      });

      await this.cognitoClient.send(command);

      return { message: 'Password reset code sent' };
    } catch (error: any) {
      this.handleCognitoError(error);
      throw error; // Adiciona throw para satisfazer o TypeScript
    }
  }

  /**
   * Confirma nova senha
   */
  async confirmForgotPassword(email: string, code: string, newPassword: string) {
    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword,
      });

      await this.cognitoClient.send(command);

      return { message: 'Password reset successfully' };
    } catch (error: any) {
      this.handleCognitoError(error);
      throw error; // Adiciona throw para satisfazer o TypeScript
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const command = new AdminInitiateAuthCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        AuthParameters: {
          REFRESH_TOKEN: refreshTokenDto.refreshToken,
        },
      });

      const response = await this.cognitoClient.send(command);

      return {
        accessToken: response.AuthenticationResult?.AccessToken,
        idToken: response.AuthenticationResult?.IdToken,
        expiresIn: response.AuthenticationResult?.ExpiresIn,
      };
    } catch (error: any) {
      this.handleCognitoError(error);
      throw error; // Adiciona throw para satisfazer o TypeScript
    }
  }

  /**
   * Valida token JWT
   */
  async validateToken(token: string): Promise<any> {
    try {
      const decoded = this.jwtService.decode(token);
      if (!decoded || typeof decoded !== 'object') {
        throw new UnauthorizedException('Invalid token');
      }

      // TODO: Implementar validação completa do token Cognito
      // - Verificar assinatura com chave pública do Cognito
      // - Verificar exp, iss, aud
      
      return decoded;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Obtém usuário do Cognito
   */
  private async getCognitoUser(email: string): Promise<any> {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: email,
      });

      const response = await this.cognitoClient.send(command);
      
      // Converte atributos para objeto
      const attributes: any = {};
      response.UserAttributes?.forEach(attr => {
        attributes[attr.Name] = attr.Value;
      });

      return {
        sub: attributes.sub,
        email: attributes.email,
        email_verified: attributes.email_verified === 'true',
        name: attributes.name,
        nickname: attributes.nickname,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Busca ou cria usuário no DynamoDB
   */
  private async findOrCreateUser(cognitoUser: any) {
    let user = await this.usersRepository.findByCognitoSub(cognitoUser.sub);
    
    if (!user) {
      user = await this.usersRepository.create({
        data: {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          cognitoSub: cognitoUser.sub,
          email: cognitoUser.email,
          emailVerified: cognitoUser.email_verified,
          nickname: cognitoUser.nickname,
          fullName: cognitoUser.name || '',
          role: 'SUBSCRIBER',
          isActive: true,
          isBanned: false,
          postsCount: 0,
          commentsCount: 0,
          likesCount: 0,
          followersCount: 0,
          followingCount: 0,
          preferences: {
            theme: 'system',
            language: 'pt-BR',
            emailNotifications: true,
            pushNotifications: true,
            newsletter: false,
          },
        },
      });
    }

    return user;
  }

  /**
   * Trata erros do Cognito
   */
  private handleCognitoError(error: any) {
    switch (error.name) {
      case 'NotAuthorizedException':
        throw new UnauthorizedException('Invalid credentials');
      case 'UserNotFoundException':
        throw new UnauthorizedException('User not found');
      case 'UserNotConfirmedException':
        throw new UnauthorizedException('User not confirmed');
      case 'UsernameExistsException':
        throw new UnauthorizedException('User already exists');
      case 'InvalidParameterException':
        throw new UnauthorizedException('Invalid parameters');
      case 'TooManyRequestsException':
        throw new UnauthorizedException('Too many requests');
      case 'ExpiredCodeException':
        throw new UnauthorizedException('Code has expired');
      case 'CodeMismatchException':
        throw new UnauthorizedException('Invalid code');
      default:
        console.error('Cognito error:', error);
        throw new UnauthorizedException('Authentication failed');
    }
  }
}
