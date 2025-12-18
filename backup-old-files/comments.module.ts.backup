/**
 * Módulo de Comentários
*
* Módulo NestJS para gerenciamento de comentários em posts.
* Reúne controllers e services para criação, listagem, atualização,
* remoção e moderação de comentários.
 *
 * Controllers:
 * - CommentsController
 *
 * Providers:
 * - CommentsService
 * - CommentsRepository
 *
 * Exports:
 * - CommentsService
 * - CommentsRepository
 *
 *
 * @module modules/comments/comments.module
 */
import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller.js';
import { CommentsService } from './comments.service.js';
import { CommentsRepository } from './comments.repository.js';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, CommentsRepository],
  exports: [CommentsService, CommentsRepository],
})
export class CommentsModule {}

