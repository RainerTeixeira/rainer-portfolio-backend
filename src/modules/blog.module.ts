import { Module } from '@nestjs/common';
import { AuthorsModule } from '@src/modules/blog/authors/authors.module';
import { CategoryModule } from '@src/modules/blog/category/category.module';
import { CommentsModule } from '@src/modules/blog/comments/comments.module';
import { PostsModule } from '@src/modules/blog/posts/posts.module';
import { SubcategoryModule } from '@src/modules/blog/subcategory/subcategory.module';

/**
 * BlogModule
 * 
 * Módulo que agrega os submódulos do blog:
 * - Fornece uma forma centralizada de importar e exportar os módulos que compõem o blog.
 */
@Module({
  imports: [
    AuthorsModule,
    CategoryModule,
    CommentsModule,
    PostsModule,
    SubcategoryModule,
  ],
  exports: [
    AuthorsModule,
    CategoryModule,
    CommentsModule,
    PostsModule,
    SubcategoryModule,
  ],
})
export class BlogModule { }
