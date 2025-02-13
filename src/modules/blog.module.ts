// src/modules/blog/blog.module.ts

import { Module } from '@nestjs/common';
import { AuthorsModule } from '@src/modules/blog/authors/authors.module'; // import com @src  
import { CategoriesModule } from '@src/modules/blog/categories/categories.module'; // Import com @src
import { CommentsModule } from '@src/modules/blog/comments/comments.module'; // Import com @src
import { PostsModule } from '@src/modules/blog/posts/posts.module'; // Import com @src
import { SubcategoryModule } from '@src/modules/blog/Subcategory/subcategory.module'; // Import com @src

@Module({
  imports: [
    AuthorsModule,
    CategoriesModule,
    CommentsModule,
    PostsModule,
    SubcategoryModule,
  ],
  exports: [ // Exporta os módulos de submódulos se precisar usá-los em outros módulos fora de 'blog'
    AuthorsModule,
    CategoriesModule,
    CommentsModule,
    PostsModule,
    SubcategoryModule,
  ],
})
export class BlogModule { }