import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { BlogModule } from '@src/modules/blog.module';
import { ResponseInterceptor } from './interceptors/response.interceptor';

/**
 * @swagger
 * components:
 *   schemas:
 *     Blog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID do blog
 *         title:
 *           type: string
 *           description: Título do blog
 *         content:
 *           type: string
 *           description: Conteúdo do blog
 *       required:
 *         - id
 *         - title
 *         - content
 */
@Module({
  imports: [
    CacheModule.register({
      ttl: 300, // 5 minutos
      max: 100, // Número máximo de itens no cache
      isGlobal: true, // Torna o cache disponível globalmente
    }),
    BlogModule,
  ],
  providers: [
    DynamoDbService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
  exports: [DynamoDbService],
})
export class AppModule {}