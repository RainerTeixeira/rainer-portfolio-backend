import { Module, forwardRef } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PostsService } from '@src/modules/blog/posts/services/posts.service';
import { PostsController } from '@src/modules/blog/posts/controllers/posts.controller';

import { DynamoDbService } from '@src/services/dynamoDb.service';

import { AuthorsService } from '@src/modules/blog/authors/services/authors.service';
import { CategoryService } from '@src/modules/blog/category/services/category.service';
import { SubcategoryService } from '@src/modules/blog/subcategory/services/subcategory.service';
import { CommentsService } from '@src/modules/blog/comments/services/comments.service';
import { AuthorsModule } from '@src/modules/blog/authors/authors.module';
import { CategoryModule } from '@src/modules/blog/category/category.module';
import { SubcategoryModule } from '@src/modules/blog/subcategory/subcategory.module';

import { CommentsModule } from '@src/modules/blog/comments/comments.module';
import { memoryStore } from 'cache-manager';

/**
 * Módulo para gerenciamento de posts.
 */
@Module({
  imports: [
    forwardRef(() => AuthorsModule),
    forwardRef(() => CategoryModule),
    forwardRef(() => SubcategoryModule),
    forwardRef(() => CommentsModule),
    ConfigModule,
    CacheModule.register({
      isGlobal: true,
      store: memoryStore,
      ttl: 60 * 1000,
    }),
  ],
  controllers: [PostsController],
  providers: [
    PostsService,
    DynamoDbService,
    AuthorsService,
    CategoryService,
    SubcategoryService,
    CommentsService,
    ConfigService,
  ],
})
export class PostsModule { }