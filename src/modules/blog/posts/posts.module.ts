import { Module } from '@nestjs/common';

import { PostsService } from '@src/modules/blog/posts/services/posts.service';
import { PostsController } from '@src/modules/blog/posts/controllers/posts.controller';

import { AuthorsModule } from '@src/modules/blog/authors/authors.module';
import { CategoryModule } from '@src/modules/blog/category/category.module';
import { SubcategoryModule } from '@src/modules/blog/subcategory/subcategory.module';
import { CommentsModule } from '@src/modules/blog/comments/comments.module';

import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

/**
 * Módulo para gerenciamento de posts.
 */
@Module({
  imports: [
    AuthorsModule,
    CategoryModule,
    SubcategoryModule,
    CommentsModule,
    ConfigModule, 
    CacheModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule { }