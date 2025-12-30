/**
 * @fileoverview Módulo Raiz da Aplicação NestJS
 * 
 * Módulo principal que orquestra toda a aplicação, importando e configurando
 * todos os outros módulos necessários para o funcionamento do sistema.
 * 
 * @module app.module
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CloudinaryModule } from './common/integrations/cloudinary/cloudinary.module';
import { PostsModule } from './modules/posts/posts.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CommentsModule } from './modules/comments/comments.module';
import { LikesModule } from './modules/likes/likes.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

/**
 * Módulo raiz da aplicação.
 * 
 * Responsável por:
 * - Configurar variáveis de ambiente globalmente
 * - Importar e configurar o módulo de banco de dados
 * - Organizar a importação de todos os módulos de domínio
 * 
 * @class AppModule
 * 
 * @example
 * ```typescript
 * // A aplicação é inicializada através deste módulo
 * const app = await NestFactory.create(AppModule);
 * ```
 * 
 * @since 1.0.0
 */
@Module({
  imports: [
    /**
     * Configuração global de variáveis de ambiente.
     * Disponível em toda a aplicação através do ConfigService.
     */
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    /**
     * Módulo de banco de dados com seleção dinâmica de provider.
     * Suporta tanto Prisma (MongoDB) quanto DynamoDB.
     */
    DatabaseModule.register(),
    
    /**
     * Módulos de domínio importados em ordem de dependência:
     * 
     * 1. HealthModule - Verificação de saúde da aplicação
     * 2. AuthModule - Autenticação e autorização
     * 3. UsersModule - Gestão de usuários
     * 4. CloudinaryModule - Upload de arquivos
     * 5. PostsModule - Gestão de posts/artigos
     * 6. CategoriesModule - Categorias de conteúdo
     * 7. CommentsModule - Sistema de comentários
     * 8. LikesModule - Sistema de curtidas
     * 9. BookmarksModule - Favoritos/salvamentos
     * 10. NotificationsModule - Notificações do sistema
     * 11. DashboardModule - Painel administrativo
     */
    HealthModule,
    AuthModule,
    UsersModule,
    CloudinaryModule, // Adicionar CloudinaryModule aqui
    PostsModule,
    CategoriesModule,
    CommentsModule,
    LikesModule,
    BookmarksModule,
    NotificationsModule,
    DashboardModule,
  ],
})
export class AppModule {}

