// src/modules/blog/blog.module.ts

import { Module } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service'; // Importa o DynamoDbService para acesso ao DynamoDB
import { AuthorsModule } from '@src/modules/blog/authors/authors.module'; // Importa o módulo de autores utilizando alias @src
import { CategoryModule } from '@src/modules/blog/category/category.module'; // Importa o módulo de categorias utilizando alias @src
import { CommentsModule } from '@src/modules/blog/comments/comments.module'; // Importa o módulo de comentários utilizando alias @src
import { PostsModule } from '@src/modules/blog/posts/posts.module'; // Importa o módulo de posts utilizando alias @src
import { SubcategoryModule } from '@src/modules/blog/subcategory/subcategory.module'; // Importa o módulo de subcategorias utilizando alias @src

/**
 * @module BlogModule
 * @description
 * Módulo principal do Blog.
 * Agrupa os submódulos do blog e provê o serviço DynamoDbService.
 * Exporta todos os submódulos e o DynamoDbService para que possam ser utilizados por outros módulos.
 * 
 * @class BlogModule
 * @imports AuthorsModule, CategoryModule, CommentsModule, PostsModule, SubcategoryModule
 * @providers DynamoDbService
 * @exports AuthorsModule, CategoryModule, CommentsModule, PostsModule, SubcategoryModule, DynamoDbService
 */
@Module({
  imports: [
    AuthorsModule,
    CategoryModule,
    CommentsModule,
    PostsModule,
    SubcategoryModule,
  ],
  providers: [], // Remova DynamoDbService aqui
  exports: [
    AuthorsModule,
    CategoryModule,
    CommentsModule,
    PostsModule,
    SubcategoryModule,
  ],
})
export class BlogModule { }