// src/modules/blog/blog.module.ts

import { Module } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service'; // Importe o DynamoDbService AQUI também
import { AuthorsModule } from '@src/modules/blog/authors/authors.module'; // import com @src
import { CategoryModule } from '@src/modules/blog/category/category.module'; // Import com @src
import { CommentsModule } from '@src/modules/blog/comments/comments.module'; // Import com @src
import { PostsModule } from '@src/modules/blog/posts/posts.module'; // Import com @src
import { SubcategoryModule } from '@src/modules/blog/subcategory/subcategory.module'; // Import com @src

@Module({
  imports: [
    AuthorsModule,
    CategoryModule,
    CommentsModule,
    PostsModule,
    SubcategoryModule,
  ],
  providers: [DynamoDbService],
  exports: [ // Exporta os módulos de submódulos E o DynamoDbService!
    AuthorsModule,
    CategoryModule,
    CommentsModule,
    PostsModule,
    SubcategoryModule,
    DynamoDbService // <--- ADICIONE DynamoDbService AQUI PARA EXPORTAR!
  ],
})
export class BlogModule { }