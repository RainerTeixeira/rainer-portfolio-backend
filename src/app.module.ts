import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { BlogModule } from '@src/modules/blog.module';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigModule } from '@nestjs/config';

/**
 * @module AppModule
 * @description Módulo principal da aplicação.
 * Este módulo importa e configura outros módulos,
 * define providers globais como interceptores e filtros,
 * e exporta serviços para serem utilizados em outros módulos.
 */

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
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
  exports: [DynamoDbService],
})
export class AppModule {}