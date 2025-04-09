import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PostsController } from '@src/modules/blog/posts/controllers/posts.controller';
import { PostsService } from '@src/modules/blog/posts/services/posts.service';

// Importa os módulos que disponibilizam os serviços de domínio necessários
import { AuthorsModule } from '@src/modules/blog/authors/authors.module';
import { CategoryModule } from '@src/modules/blog/category/category.module';
import { SubcategoryModule } from '@src/modules/blog/subcategory/subcategory.module';
import { CommentsModule } from '@src/modules/blog/comments/comments.module';

/**
 * PostsModule
 * 
 * Módulo responsável pela funcionalidade de gerenciamento de posts:
 * - Importa módulos de domínio (autores, categorias, etc.) que são necessários para o enriquecimento dos posts.
 * - Registra o PostsService e o PostsController.
 * - O DynamoDbService já está registrado globalmente, assim como os outros serviços,
 *   eliminando redundância.
 */
@Module({
  imports: [
    ConfigModule,
    AuthorsModule,
    CategoryModule,
    SubcategoryModule,
    CommentsModule,
  ],
  controllers: [PostsController],
  providers: [
    PostsService,
    // Não é necessário registrar novamente:
    // - DynamoDbService (já é global via AppModule)
    // - AuthorsService, CategoryService, SubcategoryService e CommentsService (fornecidos em seus respectivos módulos)
  ],
  exports: [PostsService],
})
export class PostsModule { }
