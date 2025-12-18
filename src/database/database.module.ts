/**
 * @fileoverview Módulo de Banco de Dados
 * 
 * Módulo global que gerencia a conexão e repositórios de banco de dados.
 * Suporta seleção dinâmica entre MongoDB (Prisma) e DynamoDB.
 * 
 * @module database/database.module
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

// DynamoDB imports
import {
  DynamoDBService,
  DynamoUserRepository,
  DynamoPostRepository,
  DynamoCommentRepository,
  DynamoLikeRepository,
  DynamoCategoryRepository,
  DynamoBookmarkRepository,
  DynamoNotificationRepository,
} from './dynamodb';

// MongoDB imports
import {
  MongoDBService,
  MongoUserRepository,
  MongoPostRepository,
  MongoCommentRepository,
  MongoLikeRepository,
  MongoCategoryRepository,
  MongoBookmarkRepository,
  MongoNotificationRepository,
} from './mongodb';

// Tokens
import {
  USER_REPOSITORY,
  POST_REPOSITORY,
  COMMENT_REPOSITORY,
  LIKE_REPOSITORY,
  CATEGORY_REPOSITORY,
  BOOKMARK_REPOSITORY,
  NOTIFICATION_REPOSITORY,
} from './tokens';

/**
 * Módulo de banco de dados com suporte a múltiplos providers.
 * 
 * Características:
 * - Global: Disponível em toda a aplicação
 * - Factory pattern: Seleção dinâmica do provider
 * - Multi-database: Suporte a MongoDB e DynamoDB
 * - Type-safe: Injeção de dependência tipada
 * 
 * Seleção de provider:
 * - Via variável de ambiente DATABASE_PROVIDER
 * - Valores: 'PRISMA' (padrão) ou 'DYNAMODB'
 * 
 * @class DatabaseModule
 * 
 * @example
 * ```typescript
 * // No app.module.ts
 * DatabaseModule.register() // Registra o módulo global
 * ```
 * 
 * @example
 * ```typescript
 * // Em um serviço
 * constructor(@Inject(USER_REPOSITORY) private userRepo: UserRepository)
 * ```
 * 
 * @since 1.0.0
 */
@Global()
@Module({
  /**
   * Importa necessários para o módulo.
   */
  imports: [ConfigModule],
  
  /**
   * Providers disponíveis para injeção.
   * 
   * Inclui:
   * - Serviços de banco (DynamoDB e MongoDB)
   * - Repositórios dinâmicos baseados em configuração
   */
  providers: [
    /**
     * Serviço DynamoDB para AWS NoSQL.
     */
    DynamoDBService,
    
    /**
     * Serviço MongoDB com Prisma ORM.
     */
    MongoDBService,
    
    /**
     * Repositórios configurados via factory pattern.
     * 
     * Cada repositório é selecionado dinamicamente baseado
     * na variável de ambiente DB_DRIVER.
     */
    {
      /**
       * Provider do repositório de usuários.
       * 
       * Seleciona entre DynamoUserRepository e MongoUserRepository
       * baseado na configuração DATABASE_PROVIDER.
       */
      provide: USER_REPOSITORY,
      useFactory: (dynamo: DynamoDBService, mongo: MongoDBService, config: ConfigService) => {
        /**
         * Verifica se deve usar DynamoDB ou MongoDB (padrão PRISMA).
         */
        const dbProvider = config.get<string>('DATABASE_PROVIDER', 'PRISMA');
        return dbProvider === 'DYNAMODB' 
          ? new DynamoUserRepository(dynamo)
          : new MongoUserRepository(mongo);
      },
      /**
       * Dependências injetadas na factory.
       */
      inject: [DynamoDBService, MongoDBService, ConfigService],
    },
    {
      /**
       * Provider do repositório de posts.
       */
      provide: POST_REPOSITORY,
      useFactory: (dynamo: DynamoDBService, mongo: MongoDBService, config: ConfigService) => {
        const dbProvider = config.get<string>('DATABASE_PROVIDER', 'PRISMA');
        return dbProvider === 'DYNAMODB' 
          ? new DynamoPostRepository(dynamo)
          : new MongoPostRepository(mongo);
      },
      inject: [DynamoDBService, MongoDBService, ConfigService],
    },
    {
      /**
       * Provider do repositório de comentários.
       */
      provide: COMMENT_REPOSITORY,
      useFactory: (dynamo: DynamoDBService, mongo: MongoDBService, config: ConfigService) => {
        const dbProvider = config.get<string>('DATABASE_PROVIDER', 'PRISMA');
        return dbProvider === 'DYNAMODB' 
          ? new DynamoCommentRepository(dynamo)
          : new MongoCommentRepository(mongo);
      },
      inject: [DynamoDBService, MongoDBService, ConfigService],
    },
    {
      /**
       * Provider do repositório de likes.
       */
      provide: LIKE_REPOSITORY,
      useFactory: (dynamo: DynamoDBService, mongo: MongoDBService, config: ConfigService) => {
        const dbProvider = config.get<string>('DATABASE_PROVIDER', 'PRISMA');
        return dbProvider === 'DYNAMODB' 
          ? new DynamoLikeRepository(dynamo)
          : new MongoLikeRepository(mongo);
      },
      inject: [DynamoDBService, MongoDBService, ConfigService],
    },
    {
      /**
       * Provider do repositório de categorias.
       */
      provide: CATEGORY_REPOSITORY,
      useFactory: (dynamo: DynamoDBService, mongo: MongoDBService, config: ConfigService) => {
        const dbProvider = config.get<string>('DATABASE_PROVIDER', 'PRISMA');
        return dbProvider === 'DYNAMODB' 
          ? new DynamoCategoryRepository(dynamo)
          : new MongoCategoryRepository(mongo);
      },
      inject: [DynamoDBService, MongoDBService, ConfigService],
    },
    {
      /**
       * Provider do repositório de bookmarks.
       */
      provide: BOOKMARK_REPOSITORY,
      useFactory: (dynamo: DynamoDBService, mongo: MongoDBService, config: ConfigService) => {
        const dbProvider = config.get<string>('DATABASE_PROVIDER', 'PRISMA');
        return dbProvider === 'DYNAMODB' 
          ? new DynamoBookmarkRepository(dynamo)
          : new MongoBookmarkRepository(mongo);
      },
      inject: [DynamoDBService, MongoDBService, ConfigService],
    },
    {
      /**
       * Provider do repositório de notificações.
       */
      provide: NOTIFICATION_REPOSITORY,
      useFactory: (dynamo: DynamoDBService, mongo: MongoDBService, config: ConfigService) => {
        const dbProvider = config.get<string>('DATABASE_PROVIDER', 'PRISMA');
        return dbProvider === 'DYNAMODB' 
          ? new DynamoNotificationRepository(dynamo)
          : new MongoNotificationRepository(mongo);
      },
      inject: [DynamoDBService, MongoDBService, ConfigService],
    },
  ],
  
  /**
   * Exporta disponíveis para injeção em outros módulos.
   * 
   * Todos os repositórios e serviços são exportados
   * para uso em toda a aplicação.
   */
  exports: [
    USER_REPOSITORY,
    POST_REPOSITORY,
    COMMENT_REPOSITORY,
    LIKE_REPOSITORY,
    CATEGORY_REPOSITORY,
    BOOKMARK_REPOSITORY,
    NOTIFICATION_REPOSITORY,
    DynamoDBService,
    MongoDBService,
  ],
})
export class DatabaseModule {
  /**
   * Método estático para registro do módulo.
   * 
   * Permite registro com configurações customizadas
   * se necessário no futuro.
   * 
   * @returns {typeof DatabaseModule} Instância do módulo
   * 
   * @example
   * ```typescript
   * // Registro padrão
   * DatabaseModule.register()
   * ```
   */
  static register() {
    return DatabaseModule;
  }
}
