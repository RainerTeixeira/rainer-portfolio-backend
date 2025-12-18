/**
 * Módulo de Autenticação
 *
 * Módulo NestJS responsável pela autenticação com AWS Cognito.
 * Contém controllers e serviços essenciais para autenticação.
 *
 * Controllers:
 * - AuthController (endpoints de login, registro, OAuth)
 *
 * Providers:
 * - AuthService (integração com Cognito)
 * - CognitoStrategy (validação de JWT)
 * - CognitoGuard (proteção de rotas)
 *
 * Exports:
 * - AuthService
 *
 * @module auth/auth.module
 */
import { Module } from '@nestjs/common';
import { UsersModule } from '../modules/users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CognitoStrategy } from './strategies/cognito.strategy';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, CognitoStrategy],
  exports: [AuthService],
})
export class AuthModule {}
