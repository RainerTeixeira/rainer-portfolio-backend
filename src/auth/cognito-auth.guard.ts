import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import { Request } from 'express';

/**
 * Guard de autenticação JWT integrado com AWS Cognito.
 *
 * Realiza a validação de tokens JWT utilizando o protocolo OpenID Connect (JWKS)
 * e as chaves públicas do Cognito. Ideal para APIs Serverless com AWS Lambda.
 *
 * @example
 * @Controller('posts')
 * @ApiBearerAuth()
 * @ApiUnauthorizedResponse({ description: 'Token JWT inválido ou ausente' })
 * export class PostsController {
 *   @UseGuards(CognitoAuthGuard)
 *   @Post()
 *   createPost() { ... }
 * }
 */
@Injectable()
export class CognitoAuthGuard implements CanActivate {
  private jwksClient: JwksClient;
  private issuer: string;

  /**
   * Inicializa o client JWKS e configurações do Cognito
   * @param configService Serviço para acesso às variáveis de ambiente
   */
  constructor(private configService: ConfigService) {
    // Configura o endpoint JWKS dinamicamente com base nas variáveis de ambiente
    this.issuer = `https://cognito-idp.${this.configService.get('AWS_REGION')}.amazonaws.com/${this.configService.get('COGNITO_USER_POOL_ID')}`;

    /**
     * Cria uma instância do JWKS Client com cache ativado para melhor performance
     * @see https://auth0.github.io/node-jwks-rsa/
     */
    this.jwksClient = new JwksClient({
      jwksUri: this.configService.get<string>('COGNITO_JWKS_URL') || '',
      cache: true,       // Habilita cache de chaves
      rateLimit: true,   // Previne DDoS
      jwksRequestsPerMinute: 10 // Limite de requisições ao JWKS
    });
  }

  /**
   * Método principal do guard que implementa a lógica de autenticação
   * @param context Contexto de execução do NestJS
   * @returns Promise<boolean> true se autenticado
   * @throws UnauthorizedException em caso de falha na autenticação
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      // Etapas do processo de autenticação
      const token = this.extractToken(request);
      const decoded = await this.validateToken(token);
      request['user'] = decoded; // Anexa dados do usuário à requisição (use string index signature)
      return true;
    } catch (error) {
      // Log detalhado para ambiente de desenvolvimento
      if (this.configService.get('NODE_ENV') === 'development') {
        console.error('Falha na autenticação:', (error as Error).message);
      }
      throw new UnauthorizedException('Credenciais inválidas');
    }
  }

  /**
   * Extrai o token JWT do header Authorization
   * @param request Objeto de requisição do Express
   * @returns Token JWT
   * @throws UnauthorizedException Se o header estiver ausente ou mal formatado
   */
  private extractToken(request: Request): string {
    const authHeader = request.headers.authorization;

    // Log detalhado para verificar o valor do cabeçalho de autorização
    if (this.configService.get('NODE_ENV') === 'development') {
      console.log('Authorization Header:', authHeader);
    }

    // Verifica formato do header: Bearer <token>
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Formato de autorização inválido. Use: Bearer <token>');
    }

    return authHeader.split(' ')[1];
  }

  /**
   * Valida o token JWT usando as chaves públicas do Cognito
   * @param token Token JWT
   * @returns Payload decodificado
   * @throws Error Se a validação falhar
   */
  private async validateToken(token: string): Promise<Record<string, unknown>> {
    // Função de callback para obtenção dinâmica da chave
    const getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
      this.jwksClient.getSigningKey(header.kid, (err, key) => {
        callback(err, key?.getPublicKey());
      });
    };

    // Configurações de validação do token
    const verifyOptions: jwt.VerifyOptions = {
      algorithms: ['RS256'],       // Algoritmo exigido pelo Cognito
      issuer: this.issuer,          // URL do User Pool
      ignoreExpiration: false,     // Rejeita tokens expirados
      clockTolerance: 5,           // Margem de 5s para sincronia de relógio
    };

    // Validação assíncrona do token
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        getKey,
        { algorithms: ['RS256'] },
        (err, decoded) => {
          if (err) {
            throw new UnauthorizedException('Token inválido.');
          }
          resolve(decoded as Record<string, unknown>);
        }
      );
    });
  }
}
