// src/modules/blog/posts/posts.module.ts

import { Module, forwardRef } from '@nestjs/common'; // Importa o decorator Module e forwardRef para resolver dependências circulares
import { PostsController } from './controllers/posts.controller'; // Importa o controlador de posts
import { PostsService } from './services/posts.service'; // Importa o serviço de posts
import { BlogModule } from '@src/modules/blog.module'; // Importa o BlogModule (módulo principal do blog)
import { DynamoDbService } from '@src/services/dynamodb.service'; // Importa o serviço DynamoDbService
import { CategoryModule } from '@src/modules/blog/category/category.module'; // Importe o módulo correto
import { AuthorsModule } from '@src/modules/blog/authors/authors.module'; // Importe o módulo correto
import { CommentsModule } from '@src/modules/blog/comments/comments.module'; // Importe o módulo correto
import { SubcategoryModule } from '@src/modules/blog/subcategory/subcategory.module'; // Importe o módulo de subcategorias
import { CacheModule } from '@nestjs/cache-manager'; // Importa o CacheModule

/**
 * Define o módulo de Posts.
 * Este módulo agrupa o controlador e o serviço de posts e importa o BlogModule utilizando forwardRef para evitar dependências circulares.
 */
@Module({
    imports: [
        CacheModule.register({
            ttl: 300, // seconds
        }),
        forwardRef(() => BlogModule),
        CategoryModule,
        AuthorsModule, // Adicione o módulo aqui
        CommentsModule, // Adicione o módulo aqui
        forwardRef(() => SubcategoryModule), // Adicione o forwardRef aqui
    ],
    controllers: [PostsController],
    providers: [PostsService, DynamoDbService], // Adiciona DynamoDbService provider
    exports: [PostsService], // Exporta PostsService para ser usado em outros módulos
})
export class PostsModule { }