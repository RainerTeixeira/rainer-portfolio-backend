// src/modules/blog/blog.module.ts

import { Module } from '@nestjs/common';
import { AuthorsModule } from './authors/authors.module';
import { CategoriesModule } from './categories/categories.module';
import { CommentsModule } from './comments/comments.module';
import { PostsModule } from './posts/posts.module';
import { SubcategoriaModule } from './subcategoria/subcategoria.module';

@Module({
  imports: [
    AuthorsModule,
    CategoriesModule,
    CommentsModule,
    PostsModule,
    SubcategoriaModule,
  ],
  exports: [ // Exporta os módulos de submódulos se precisar usá-los em outros módulos fora de 'blog'
    AuthorsModule,
    CategoriesModule,
    CommentsModule,
    PostsModule,
    SubcategoriaModule,
  ],
})
export class BlogModule { }