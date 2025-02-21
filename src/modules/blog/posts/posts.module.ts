// src/modules/blog/posts/posts.module.ts

import { Module, forwardRef } from '@nestjs/common'; // Importa o decorator Module e forwardRef para resolver dependências circulares
import { PostsController } from './controllers/posts.controller'; // Importa o controlador de posts
import { PostsService } from './services/posts.service'; // Importa o serviço de posts
import { BlogModule } from '@src/modules/blog.module'; // Importa o BlogModule (módulo principal do blog)

/**
 * Define o módulo de Posts.
 * Este módulo agrupa o controlador e o serviço de posts e importa o BlogModule utilizando forwardRef para evitar dependências circulares.
 */
@Module({
    imports: [forwardRef(() => BlogModule)], // Usa forwardRef para adiar a resolução do BlogModule e resolver dependência circular
    controllers: [PostsController],
    providers: [PostsService],
    exports: [PostsService], // Exporta PostsService para ser usado em outros módulos
})
export class PostsModule { }