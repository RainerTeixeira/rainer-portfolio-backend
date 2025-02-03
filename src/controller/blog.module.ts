import { Module } from '@nestjs/common';

// Importando apenas os controladores e serviços de posts
import { PostsController } from './blog/posts/posts.controller';
import { PostsService } from './blog/posts/posts.service';

// Outros controladores e serviços foram comentados
/*
import { AuthorsController } from './blog/authors/authors.controller';
import { AuthorsService } from './blog/authors/authors.service';

import { CategoriesController } from './blog/categories/categories.controller';
import { CategoriesService } from './blog/categories/categories.service';

import { CommentsController } from './blog/comments/comments.controller';
import { CommentsService } from './blog/comments/comments.service';

import { ExternalIntegrationsController } from './blog/external-integrations/external-integrations.controller';
import { ExternalIntegrationsService } from './blog/external-integrations/external-integrations.service';
*/

@Module({
    controllers: [
        PostsController, // Apenas PostsController será usado
    ],
    providers: [
        PostsService, // Apenas PostsService será usado
    ],
    // Exports também apenas para PostsService, caso seja necessário em outros módulos
    exports: [
        PostsService,
    ],
})
export class BlogModule { }
