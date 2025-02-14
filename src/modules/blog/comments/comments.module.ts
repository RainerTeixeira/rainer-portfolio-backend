// src/modules/blog/comments/comments.module.ts

import { Module } from '@nestjs/common'; // Importa o decorator Module do NestJS.
import { CommentsController } from '@src/modules/blog/comments/controllers/comments.controller'; // Importa CommentsController usando alias @src.
import { CommentsService } from '@src/modules/blog/comments/services/comments.service'; // Importa CommentsService usando alias @src.
import { BlogModule } from '@src/modules/blog/blog.module'; // <--- IMPORTA BlogModule AQUI!


@Module({
    controllers: [CommentsController],
    providers: [CommentsService],
    exports: [CommentsService],
})
export class CommentsModule { }