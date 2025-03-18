import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { JwksClient } from 'jwks-rsa';

/**
 * Guard para autenticação via Cognito utilizando JWT e JWKS.
 * 
 * Este guard intercepta as requisições HTTP, extrai o token do cabeçalho de autorização,
 * valida-o utilizando as chaves públicas (JWKS) do Cognito e, caso seja válido, anexa
 * os dados do usuário decodificado à requisição.
 * 
 * Exemplo de documentação Swagger:
 * - Utilize o decorator `@ApiBearerAuth()` no controller para indicar que o endpoint exige um token Bearer.
 * - Utilize `@ApiUnauthorizedResponse()` para documentar a resposta em caso de token inválido.
 */
@Injectable()
export class CognitoAuthGuard implements CanActivate {
  private jwksClient: JwksClient;
  private issuer: string;

  /**
   * Construtor que inicializa as configurações para validação do token.
   *
   * @param configService Serviço de configuração para acesso às variáveis de ambiente.
   */
  constructor(private configService: ConfigService) {
    this.issuer = `https://cognito-idp.${configService.get('AWS_REGION')}.amazonaws.com/${configService.get('COGNITO_USER_POOL_ID')}`;

    this.jwksClient = new JwksClient({
      jwksUri: configService.get('COGNITO_JWKS_URL'),
      cache: true,
      rateLimit: true,
    });
  }

  /**
   * Método que intercepta a requisição e realiza a validação do token JWT.
   * Se o token for válido, o objeto decodificado é anexado à requisição em `request.user`.
   *
   * @param context Contexto de execução da requisição.
   * @returns Promise que indica se a requisição está autorizada.
   * @throws UnauthorizedException se o token não for válido ou não estiver presente.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    try {
      const decoded = await this.validateToken(token);
      request.user = decoded;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Extrai o token JWT do cabeçalho de autorização da requisição.
   *
   * @param request Requisição HTTP.
   * @returns O token JWT extraído.
   * @throws UnauthorizedException se o cabeçalho de autorização estiver ausente ou mal formatado.
   */
  private extractToken(request: any): string {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authorization header');
    }
    return authHeader.split(' ')[1];
  }

  /**
   * Valida o token JWT utilizando as chaves públicas obtidas do JWKS do Cognito.
   *
   * @param token Token JWT a ser validado.
   * @returns Promise contendo o token decodificado se a validação for bem-sucedida.
   * @throws Erro caso o token seja inválido ou a validação falhe.
   */
  private async validateToken(token: string): Promise<any> {
    const getKey = (header: any, callback: any) => {
      this.jwksClient.getSigningKey(header.kid, (err, key) => {
        callback(err, key?.getPublicKey());
      });
    };

    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        getKey,
        {
          algorithms: ['RS256'],
          issuer: this.issuer,
        },
        (err, decoded) => {
          if (err) return reject(err);
          resolve(decoded);
        }
      );
    });
  }
}
