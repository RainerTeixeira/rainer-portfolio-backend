import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

// Componentes locais
import { PostsController } from '@src/modules/blog/posts/posts.controller';
import { PostService } from '@src/modules/blog/posts/posts.service';
import { PostRepository } from '@src/modules/blog/posts/post.repository';

// Módulos de dependência
import { AuthorsModule } from '@src/modules/blog/authors/authors.module';
import { CategoryModule } from '@src/modules/blog/category/category.module';
import { SubcategoryModule } from '@src/modules/blog/subcategory/subcategory.module';
import { CommentsModule } from '@src/modules/blog/comments/comments.module';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300,
      max: 100,
    }),
    AuthorsModule,
    CategoryModule,
    SubcategoryModule,
    CommentsModule,
  ],
  controllers: [PostsController],
  providers: [PostService, PostRepository],
  exports: [PostService],
})
export class PostsModule { }