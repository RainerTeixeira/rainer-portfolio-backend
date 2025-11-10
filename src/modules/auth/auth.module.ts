/**
 * Módulo de Autenticação
*
* Módulo NestJS responsável pela autenticação e sincronização de usuários.
* Agrupa controllers e providers relacionados a login, registro e integração
* com provedores externos (ex.: Cognito), mantendo dependências encapsuladas.
 *
 * Controllers:
 * - AuthController
 *
 * Providers:
 * - AuthService
 * - AuthRepository
 *
 * Imports:
 * - UsersModule
 *
 * Exports:
 * - AuthService
 * - AuthRepository
 *
 *
 * @module modules/auth/auth.module
 */
import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthRepository } from './auth.repository.js';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
  exports: [AuthService, AuthRepository],
})
export class AuthModule {}
