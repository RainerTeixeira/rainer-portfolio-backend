// src/modules/blog/blog.module.ts
import { Module } from '@nestjs/common';
import { PostsModule } from './posts/posts.module';
import { AuthorsModule } from './authors/authors.module';
import { CategoriesModule } from './categories/categories.module';
import { CommentsModule } from './comments/comments.module';
import { ExternalIntegrationsModule } from './external-integrations/external-integrations.module';

@Module({
  imports: [
    PostsModule,
    AuthorsModule,
    CategoriesModule,
    CommentsModule,
    ExternalIntegrationsModule,
  ],
})
export class BlogModule { }
