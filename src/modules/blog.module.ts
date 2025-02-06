// src/modules/blog/blog.module.ts
import { Module } from '@nestjs/common';
import { PostsModule } from '@src/modules/blog/posts/posts.module';
//import { AuthorsModule } from '@src/modules/blog/authors/autor.module';
//import { CategoriesModule } from '@src/modules/blog/authors/categories.module';
//import { CommentsModule } from '@src/modules/blog/authors/comments.module';
//import { ExternalIntegrationsModule } from './external-integrations/external-integrations.module';

@Module({
  imports: [
    PostsModule,
    //AuthorsModule,
    //CategoriesModule,
    //CommentsModule,
    //ExternalIntegrationsModule,
  ],
})
export class BlogModule { }
