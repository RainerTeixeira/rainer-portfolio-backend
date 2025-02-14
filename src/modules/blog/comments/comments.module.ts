// src/modules/blog/comments/comments.module.ts

import { Module, forwardRef } from '@nestjs/common'; // Importa o decorator Module para definir o módulo.
import { CommentsController } from '@src/modules/blog/comments/controllers/comments.controller'; // Importa CommentsController usando alias @src.
import { CommentsService } from '@src/modules/blog/comments/services/comments.service'; // Importa CommentsService usando alias @src.
import { BlogModule } from '@src/modules/blog.module'; // <--- IMPORTA BlogModule AQUI!


@Module({
    imports: [forwardRef(() => BlogModule)], // Use forwardRef envolvendo BlogModule para resolver dependência circular
    controllers: [CommentsController],
    providers: [CommentsService],
    exports: [CommentsService],
})
export class CommentsModule { }