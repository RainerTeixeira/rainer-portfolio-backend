// src/modules/blog/blog.module.ts
import { Module } from '@nestjs/common';
import { AuthorsModule } from './authors/authors.module';
import { CategoriesModule } from './categories/categories.module';
import { CommentsModule } from './comments/comments.module';
import { PostsModule } from './posts/posts.module';
import { SubcategoriesModule } from './subcategories/subcategories.module';

@Module({
  imports: [
    AuthorsModule,
    CategoriesModule,
    CommentsModule,
    PostsModule,
    SubcategoriesModule,
  ],
})
export class BlogModule { }