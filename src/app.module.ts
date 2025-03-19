import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { BlogModule } from '@src/modules/blog.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';

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

    // Configuração de cache (CORREÇÃO AQUI)
    CacheModule.register({
      isGlobal: true,
      ttl: 300,
      max: 100,
    }),

    // Módulos de funcionalidades
    BlogModule,
    AuthModule,
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
export class AppModule { }