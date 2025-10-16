/**
 * App Module - Módulo Raiz NestJS
 * 
 * Módulo principal que importa todos os outros módulos da aplicação.
 * 
 * @module app.module
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { DatabaseProviderModule } from './utils/database-provider/index.js';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { PostsModule } from './modules/posts/posts.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { CommentsModule } from './modules/comments/comments.module.js';
import { LikesModule } from './modules/likes/likes.module.js';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';

/**
 * Módulo raiz da aplicação
 * 
 * Importa:
 * - ConfigModule: Gerenciamento de variáveis de ambiente
 * - DatabaseProviderModule: Seleção dinâmica de banco de dados
 * - PrismaModule: Cliente Prisma compartilhado
 * - Módulos de domínio: users, posts, categories, etc.
 */
@Module({
  imports: [
    // Config global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Database Provider Selector (global)
    DatabaseProviderModule,
    
    // Prisma global
    PrismaModule,
    
    // Módulos de domínio (ordenados por lógica de uso)
    HealthModule,
    AuthModule,
    UsersModule,
    PostsModule,
    CategoriesModule,
    CommentsModule,
    LikesModule,
    BookmarksModule,
    NotificationsModule,
  ],
})
export class AppModule {}

