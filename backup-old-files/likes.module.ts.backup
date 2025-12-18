/**
 * Módulo de Likes
*
* Módulo NestJS para gerenciamento de curtidas (likes) em posts.
* Unifica controllers e services para curtir, descurtir, listar e
* contar likes por post e por usuário.
 *
 * Controllers:
 * - LikesController
 *
 * Providers:
 * - LikesService
 * - LikesRepository
 *
 * Exports:
 * - LikesService
 * - LikesRepository
 *
 *
 * @module modules/likes/likes.module
 */
import { Module } from '@nestjs/common';
import { LikesController } from './likes.controller.js';
import { LikesService } from './likes.service.js';
import { LikesRepository } from './likes.repository.js';

@Module({
  controllers: [LikesController],
  providers: [LikesService, LikesRepository],
  exports: [LikesService, LikesRepository],
})
export class LikesModule {}

