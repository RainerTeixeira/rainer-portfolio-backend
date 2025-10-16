/**
 * Posts Module
 * 
 * Módulo NestJS para gerenciamento de posts/artigos.
 * 
 * @module modules/posts/posts.module
 */

import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller.js';
import { PostsService } from './posts.service.js';
import { PostsRepository } from './posts.repository.js';

@Module({
  controllers: [PostsController],
  providers: [PostsService, PostsRepository],
  exports: [PostsService, PostsRepository],
})
export class PostsModule {}

