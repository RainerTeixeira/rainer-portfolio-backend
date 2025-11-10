/**
 * Módulo de Bookmarks
*
* Módulo NestJS para gerenciamento de favoritos (bookmarks) de posts.
* Centraliza controllers e services para criação, listagem, organização
* e remoção de bookmarks por usuário e por coleção.
 *
 * Controllers:
 * - BookmarksController
 *
 * Providers:
 * - BookmarksService
 * - BookmarksRepository
 *
 * Exports:
 * - BookmarksService
 * - BookmarksRepository
 *
 *
 * @module modules/bookmarks/bookmarks.module
 */
import { Module } from '@nestjs/common';
import { BookmarksController } from './bookmarks.controller.js';
import { BookmarksService } from './bookmarks.service.js';
import { BookmarksRepository } from './bookmarks.repository.js';

@Module({
  controllers: [BookmarksController],
  providers: [BookmarksService, BookmarksRepository],
  exports: [BookmarksService, BookmarksRepository],
})
export class BookmarksModule {}

