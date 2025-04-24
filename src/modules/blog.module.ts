import { Module } from '@nestjs/common';
import { AuthorsModule } from '@src/modules/blog/authors/authors.module';
import { CategoryModule } from '@src/modules/blog/category/category.module';
import { CommentsModule } from '@src/modules/blog/comments/comments.module';
import { PostsModule } from '@src/modules/blog/posts/posts.module';
import { SubcategoryModule } from '@src/modules/blog/subcategory/subcategory.module';

/**
 * BlogModule
 * 
 * Módulo principal do blog que agrega e organiza todos os submódulos relacionados:
 * - Centraliza as importações e exportações dos recursos do blog
 * - Facilita a manutenção e escalabilidade do sistema
 */
@Module({
  imports: [ // Lista de módulos necessários para o funcionamento do BlogModule
    AuthorsModule,       // Responsável pelos autores
    CategoryModule,      // Gerencia categorias
    CommentsModule,      // Lida com comentários
    PostsModule,         // Cuida dos posts (principal recurso)
    SubcategoryModule,   // Gerencia subcategorias
  ],
  exports: [ // Lista de módulos que serão disponibilizados para outros módulos da aplicação
    AuthorsModule,
    CategoryModule,
    CommentsModule,
    PostsModule,
    SubcategoryModule,
  ],
})
export class BlogModule { }