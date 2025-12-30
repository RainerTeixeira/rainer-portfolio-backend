/**
 * @fileoverview Estratégia de Autenticação JWT AWS Cognito
 * 
 * Estratégia Passport para validação de tokens JWT emitidos
 * pelo AWS Cognito, utilizando a biblioteca passport-jwt.
 * 
 * @module auth/strategies/cognito.strategy
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { cognito } from '../../common/config';

/**
 * Estratégia JWT para validação de tokens do AWS Cognito.
 * 
 * Responsável por:
 * - Extrair token JWT do header Authorization
 * - Validar assinatura e expiração do token
 * - Verificar issuer e audience do Cognito
 * - Transformar payload para formato padrão da aplicação
 * 
 * @class CognitoStrategy
 * @extends PassportStrategy
 * 
 * @example
 * ```typescript
 * // A estratégia é utilizada automaticamente pelo CognitoGuard
 * // Não há necessidade de uso direto no código
 * ```
 * 
 * @since 1.0.0
 */
@Injectable()
export class CognitoStrategy extends PassportStrategy(Strategy) {
  /**
   * Construtor da estratégia JWT.
   * 
   * Configura a validação de tokens JWT com as especificações
   * do AWS Cognito, incluindo verificação de issuer e audience.
   */
  constructor() {
    super({
      /**
       * Extrai o token do header Authorization: Bearer <token>
       */
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      /**
       * Não ignora expiração - tokens expirados são rejeitados
       */
      ignoreExpiration: false,
      
      /**
       * Chave secreta para verificar assinatura do token
       */
      secretOrKey: cognito.tokenValidation.jwksUri,
      
      /**
       * Client ID do Cognito (audience do token)
       */
      audience: cognito.clientId,
      
      /**
       * URL do issuer do Cognito User Pool
       */
      issuer: cognito.issuer,
    });
  }

  /**
   * Valida o payload do token JWT e transforma para formato da aplicação.
   * 
   * Este método é chamado após a validação bem-sucedida da assinatura
   * e expiração do token. Extrai as informações relevantes do payload
   * e retorna no formato esperado pela aplicação.
   * 
   * @method validate
   * @param {object} payload - Payload decodificado do token JWT
   * @param {string} payload.sub - ID único do usuário no Cognito
   * @param {string} payload.email - Email do usuário
   * @param {string} [payload.name] - Nome completo do usuário
   * @param {string} [payload['cognito:username']] - Username do Cognito
   * @param {string} [payload.nickname] - Nickname do usuário
   * @returns {Promise<object>} Objeto usuário no formato da aplicação
   * 
   * @example
   * ```typescript
   * // Retorno esperado:
   * {
   *   cognitoSub: '12345678-1234-1234-1234-123456789012',
   *   email: 'user@example.com',
   *   fullName: 'User Name',
   *   username: 'user@example.com',
   *   nickname: 'user123'
   * }
   * ```
   */
  async validate(payload: {
    sub: string;
    email: string;
    name?: string;
    'cognito:username'?: string;
    nickname?: string;
  }) {
    // O payload já foi validado pela estratégia
    // Transforma para o formato padrão da aplicação
    return {
      cognitoSub: payload.sub,
      email: payload.email,
      fullName: payload.name,
      username: payload['cognito:username'],
      nickname: payload.nickname,
    };
  }
}
