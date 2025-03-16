import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { BlogModule } from '@src/modules/blog.module';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigModule } from '@nestjs/config';
// import { ServeStaticModule } from '@nestjs/serve-static';
// import { join } from 'path';

/**
 * @module AppModule
 * @description Módulo raiz da aplicação NestJS. Configuração global de:
 * - Variáveis de ambiente
 * - Cache
 * - Interceptores
 * - Filtros de exceção
 * - Serviços compartilhados
 * 
 * @swagger
 * tags:
 *   - name: Blog
 *     description: Operações relacionadas a posts de blog
 */
@Global()
@Module({
  imports: [
    // Configuração de ambiente
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
    }),

    // Configuração de cache
    CacheModule.register({
      ttl: 300, // 5 minutos (em segundos)
      max: 100, // Máximo de itens armazenados
      isGlobal: true,
    }),

    // Módulos de funcionalidades
    BlogModule,
  ],
  providers: [
    // Serviço compartilhado
    DynamoDbService,

    // Interceptor global
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },

    // Filtro de exceção global
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
  exports: [DynamoDbService],
})
export class AppModule { }