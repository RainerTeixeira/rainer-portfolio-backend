import { Global, Module, forwardRef } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { DynamoDbService } from '@src/services/dynamoDb.service';
import { BlogModule } from '@src/modules/blog.module';
import { AuthModule } from '@src/auth/auth.module';
import { ResponseInterceptor } from '@src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '@src/common/filters/http-exception.filter';

import { PostsModule } from './modules/blog/posts/posts.module';
import { AuthorsModule } from './modules/blog/authors/authors.module';
import { CategoryModule } from './modules/blog/category/category.module';
import { SubcategoryModule } from './modules/blog/subcategory/subcategory.module';
import { CommentsModule } from './modules/blog/comments/comments.module';

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

    // Módulos de funcionalidades
    forwardRef(() => BlogModule),
    AuthModule,
    PostsModule,
    AuthorsModule,
    CategoryModule,
    SubcategoryModule,
    CommentsModule,
  ],
  providers: [
    {
      provide: DynamoDbService,
      useFactory: () => DynamoDbService.getInstance(),
    },
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