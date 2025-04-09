import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

import { HttpExceptionFilter } from '@src/common/filters/http-exception.filter';
import { BlogModule } from '@src/modules/blog.module';
import { AuthModule } from '@src/auth/auth.module';
import { DynamoDbService } from '@src/services/dynamoDb.service';

/**
 * AppModule
 * 
 * Módulo principal da aplicação:
 * - Configura as variáveis de ambiente e o cache global.
 * - Importa os módulos principais (Blog e Auth).
 * - Registra providers globais, como o DynamoDbService e o filtro de exceção.
 */
@Global()
@Module({
  imports: [
    // Configuração global de variáveis de ambiente
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      validationOptions: { allowUnknown: false, abortEarly: true },
    }),
    // Registro global do cache com TTL de 60 segundos
    CacheModule.register({
      isGlobal: true,
      ttl: 60,
    }),
    // Importa os módulos de domínio
    BlogModule,
    AuthModule,
  ],
  providers: [
    // Registra o DynamoDbService como singleton global
    { provide: DynamoDbService, useClass: DynamoDbService },
    // Filtro global para tratamento de exceções HTTP
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
  // Exporta o DynamoDbService para que outros módulos o utilizem, se necessário
  exports: [DynamoDbService],
})
export class AppModule { }
