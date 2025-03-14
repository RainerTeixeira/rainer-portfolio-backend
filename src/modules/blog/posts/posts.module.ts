// src/modules/blog/posts/posts.module.ts

import { Module, forwardRef } from '@nestjs/common'; // Importa o decorator Module e forwardRef para resolver dependências circulares
import { PostsController } from './controllers/posts.controller'; // Importa o controlador de posts
import { PostsService } from './services/posts.service'; // Importa o serviço de posts
import { BlogModule } from '@src/modules/blog.module'; // Importa o BlogModule (módulo principal do blog)
import { DynamoDbService } from '@src/services/dynamodb.service'; // Importa o serviço DynamoDbService
import { CategoriesModule } from '@src/modules/blog/categories/categories.module'; // Importe o módulo correto
import { AuthorsModule } from '@src/modules/blog/authors/authors.module'; // Importe o módulo correto
import { CommentsModule } from '@src/modules/blog/comments/comments.module'; // Importe o módulo correto

/**
 * Define o módulo de Posts.
 * Este módulo agrupa o controlador e o serviço de posts e importa o BlogModule utilizando forwardRef para evitar dependências circulares.
 */
@Module({
    imports: [
        forwardRef(() => BlogModule),
        CategoriesModule,
        AuthorsModule, // Adicione o módulo aqui
        CommentsModule, // Adicione o módulo aqui
    ],
    controllers: [PostsController],
    providers: [PostsService, DynamoDbService], // Adiciona DynamoDbService como provedor
    exports: [PostsService], // Exporta PostsService para ser usado em outros módulos
})
export class PostsModule { }