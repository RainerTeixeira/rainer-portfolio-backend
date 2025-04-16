import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

import { PostsController } from '@src/modules/blog/posts/posts.controller';
import { PostsService } from '@src/modules/blog/posts/posts.service';
import { PostsRepository } from '@src/modules/blog/posts/posts.repository';

// Importa os módulos que disponibilizam os serviços de domínio necessários
import { AuthorsModule } from '@src/modules/blog/authors/authors.module';
import { CategoryModule } from '@src/modules/blog/category/category.module';
import { SubcategoryModule } from '@src/modules/blog/subcategory/subcategory.module';
import { CommentsModule } from '@src/modules/blog/comments/comments.module';

/**
 * PostsModule
 * 
 * Módulo responsável pela funcionalidade de gerenciamento de posts:
 * - Importa módulos de domínio (autores, categorias, subcategorias, comentários).
 * - Registra o PostsService, PostsRepository e o PostsController.
 * - Utiliza cache local específico para este módulo.
 * - O DynamoDbService está registrado globalmente.
 *
 * @module PostsModule
 */
@Module({
  imports: [
    CacheModule.register({
      ttl: 300,
      max: 100,
    }),
    AuthorsModule,
    CategoryModule,
    SubcategoryModule,
    CommentsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsRepository],
  exports: [PostsService],
})
export class PostsModule { }
