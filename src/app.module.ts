import { Global, Module, forwardRef } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

import { DynamoDbService } from '@src/services/dynamoDb.service';
import { BlogModule } from '@src/modules/blog.module';
import { AuthModule } from '@src/auth/auth.module';
import { ResponseInterceptor } from '@src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '@src/common/filters/http-exception.filter';

import { PostsModule } from '@src/modules/blog/posts/posts.module';
import { AuthorsModule } from '@src/modules/blog/authors/authors.module';
import { CategoryModule } from '@src/modules/blog/category/category.module';
import { SubcategoryModule } from '@src/modules/blog/subcategory/subcategory.module';
import { CommentsModule } from '@src/modules/blog/comments/comments.module';

/**
 * @Module AppModule
 * @description Módulo principal da aplicação.
 * Configura variáveis de ambiente, registra o módulo de cache de forma global,
 * e importa todos os demais módulos da aplicação, além de fornecer interceptores
 * e filtros globais para tratamento de respostas e exceções.
 */
@Global()
@Module({
  imports: [
    // Configuração global do ambiente
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      validationOptions: { allowUnknown: false, abortEarly: true },
    }),
    // Registro global do CacheModule para armazenamento e recuperação de dados em cache
    CacheModule.register({
      isGlobal: true,
      ttl: 60, // Tempo de vida padrão do cache em segundos
    }),
    // Importação dos módulos de funcionalidades da aplicação
    forwardRef(() => BlogModule),
    AuthModule,
    PostsModule,
    AuthorsModule,
    CategoryModule,
    SubcategoryModule,
    CommentsModule,
  ],
  providers: [
    /**
     * Provedor para o serviço DynamoDbService.
     * Utiliza useClass para garantir que uma única instância seja utilizada em toda a aplicação.
     */
    { provide: DynamoDbService, useClass: DynamoDbService },
    /**
     * Interceptor global para formatação das respostas da API.
     */
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    /**
     * Filtro global para tratamento das exceções HTTP.
     */
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
  // Exporta o DynamoDbService para que possa ser utilizado em outros módulos
  exports: [DynamoDbService],
})
export class AppModule { }
