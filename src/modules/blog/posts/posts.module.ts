// src/modules/blog/posts/posts.module.ts

import { Module } from '@nestjs/common'; // Importa o decorator Module do NestJS.
import { PostsController } from '@src/modules/blog/posts/controllers/posts.controller'; // Importa PostsController usando alias @src.
import { PostsService    } from '@src/modules/blog/posts/services/posts.service'; // Importa PostsService usando alias @src.
import { BlogModule } from '@src/modules/blog/blog.module'; // <--- IMPORTA BlogModule AQUI!

@Module({
    controllers: [PostsController],
    providers: [PostsService],
    exports: [PostsService],
})
export class PostsModule { }