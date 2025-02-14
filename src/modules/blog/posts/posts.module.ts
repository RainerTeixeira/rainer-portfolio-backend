// src/modules/blog/posts/posts.module.ts

import { Module, forwardRef } from '@nestjs/common'; // Importa o decorator Module para definir o módulo.
import { PostsController } from '@src/modules/blog/posts/controllers/posts.controller'; // Importa PostsController usando alias @src.
import { PostsService    } from '@src/modules/blog/posts/services/posts.service'; // Importa PostsService usando alias @src.
import { BlogModule } from '@src/modules/blog.module'; // <--- IMPORTA BlogModule AQUI!

@Module({
    imports: [forwardRef(() => BlogModule)], // Use forwardRef envolvendo BlogModule para resolver dependência circular
    controllers: [PostsController],
    providers: [PostsService],
    exports: [PostsService],
})
export class PostsModule { }