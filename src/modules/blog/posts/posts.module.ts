// src/modules/blog/posts/posts.module.ts
import { Module } from '@nestjs/common';
import { PostsService } from './services/posts.service';
import { PostsController } from './controllers/posts.controller';
import { AuthorsModule } from '@src/modules/blog/authors/authors.module';
import { CategoryModule } from '@src/modules/blog/category/category.module';
import { SubcategoryModule } from '@src/modules/blog/subcategory/subcategory.module';
import { CommentsModule } from '@src/modules/blog/comments/comments.module';

/**
 * Módulo para gerenciamento de posts.
 */
@Module({
  imports: [
    AuthorsModule,
    CategoryModule,
    SubcategoryModule,
    CommentsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule { }