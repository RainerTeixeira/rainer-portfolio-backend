/**
 * Módulo de Usuários
 * 
 * Módulo NestJS para gerenciamento de usuários.
 * 
 * @module modules/users/users.module
 */

import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { UsersRepository } from './users.repository.js';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';

/**
 * Módulo de Usuários
 * 
 * Providers:
 * - UsersService: Lógica de negócio
 * - UsersRepository: Acesso a dados
 * 
 * Controllers:
 * - UsersController: Rotas HTTP
 */
@Module({
  imports: [CloudinaryModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}

