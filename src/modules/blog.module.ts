// src/modules/blog/blog.module.ts

import { Module } from '@nestjs/common';
import { AuthorsModule } from '@src/modules/blog/authors/authors.module'; // import com @src  
import { CategoriesModule } from '@src/modules/blog/categories/categories.module'; // Import com @src
import { CommentsModule } from '@src/modules/blog/comments/comments.module'; // Import com @src
import { PostsModule } from '@src/modules/blog/posts/posts.module'; // Import com @src
import { SubcategoriaModule } from '@src/modules/blog/subcategoria/subcategories.module'; // Import com @src

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