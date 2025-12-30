/**
 * @fileoverview Módulo de Usuários
 * 
 * Módulo NestJS responsável por gerenciar todas as operações
 * relacionadas aos usuários do sistema, incluindo controllers,
 * serviços e DTOs.
 * 
 * @module modules/users/users.module
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';

/**
 * Módulo de gerenciamento de usuários.
 * 
 * Responsável por:
 * - Organizar componentes relacionados a usuários
 * - Prover injeção de dependência para serviços e controllers
 * - Exportar o UsersService para uso em outros módulos
 * 
 * @class UsersModule
 * 
 * @example
 * ```typescript
 * // Importar em app.module.ts
 * import { UsersModule } from './modules/users/users.module';
 * 
 * @Module({
 *   imports: [UsersModule]
 * })
 * export class AppModule {}
 * ```
 * 
 * @since 1.0.0
 */
@Module({
  /**
   * Controllers do módulo.
   * 
   * Inclui todos os endpoints HTTP para operações com usuários:
   * - GET /users - Listar usuários
   * - GET /users/:id - Buscar usuário específico
   * - POST /users - Criar novo usuário
   * - PUT /users/:id - Atualizar usuário
   * - DELETE /users/:id - Excluir usuário
   */
  controllers: [UsersController],
  
  /**
   * Providers do módulo.
   * 
   * Serviços disponíveis para injeção de dependência:
   * - UsersService: Lógica de negócio para usuários
   */
  providers: [UsersService],
  
  /**
   * Exportações do módulo.
   * 
   * Disponibiliza o UsersService para uso em outros módulos,
   * permitindo que o AuthService e outros módulos acessem
   * as funcionalidades de gerenciamento de usuários.
   */
  exports: [UsersService],
})
export class UsersModule {}