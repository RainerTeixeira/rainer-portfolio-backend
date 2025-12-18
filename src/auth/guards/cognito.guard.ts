/**
 * @fileoverview Guard de Autenticação AWS Cognito
 * 
 * Guard responsável por proteger rotas utilizando autenticação
 * JWT via AWS Cognito como provider de identidade.
 * 
 * @module auth/guards/cognito.guard
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard para autenticação via AWS Cognito.
 * 
 * Responsável por:
 * - Validar tokens JWT em rotas protegidas
 * - Extrair informações do usuário do token
 * - Bloquear acesso a usuários não autenticados
 * 
 * @class CognitoGuard
 * @extends AuthGuard
 * 
 * @example
 * ```typescript
 * // Uso em um controller
 * @UseGuards(CognitoGuard)
 * @Get('profile')
 * getProfile(@Request() req) {
 *   return req.user;
 * }
 * ```
 * 
 * @since 1.0.0
 */
@Injectable()
export class CognitoGuard extends AuthGuard('jwt') {
  /**
   * Verifica se a requisição pode ser ativada.
   * 
   * Valida o token JWT e extrai as informações do usuário.
   * Implementação base do AuthGuard do Passport.
   * 
   * @method canActivate
   * @param {ExecutionContext} context - Contexto de execução da requisição
   * @returns {Promise<boolean>} True se autenticado, false caso contrário
   * 
   * @override
   */
  canActivate(context: ExecutionContext) {
    // Implementação temporária para compilação
    return super.canActivate(context);
  }
}
