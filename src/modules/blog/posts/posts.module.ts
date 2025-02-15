// src/modules/blog/posts/posts.module.ts

import { Module, forwardRef } from '@nestjs/common'; // Importa o decorator Module e forwardRef para resolver dependências circulares
import { PostsController } from '@src/modules/blog/posts/controllers/posts.controller'; // Importa o controlador de posts utilizando alias @src
import { PostsService } from '@src/modules/blog/posts/services/posts.service'; // Importa o serviço de posts utilizando alias @src
import { BlogModule } from '@src/modules/blog.module'; // Importa o BlogModule (módulo principal do blog)

/**
 * Define o módulo de Posts.
 * Este módulo agrupa o controlador e o serviço de posts e importa o BlogModule utilizando forwardRef para evitar dependências circulares.
 */
@Module({
    // Usa forwardRef para adiar a resolução do BlogModule e resolver dependência circular
    imports: [forwardRef(() => BlogModule)],
    // Define o controlador deste módulo
    controllers: [PostsController],
    // Define os provedores (serviços) deste módulo
    providers: [PostsService],
    // Exporta o PostsService para que outros módulos (como o BlogModule) possam utilizá-lo
    exports: [PostsService],
})
export class PostsModule { }
