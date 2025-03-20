import { Module, forwardRef } from '@nestjs/common';

import { AuthorsModule } from '@src/modules/blog/authors/authors.module';
import { CategoryModule } from '@src/modules/blog/category/category.module';
import { CommentsModule } from '@src/modules/blog/comments/comments.module';
import { PostsModule } from '@src/modules/blog/posts/posts.module';
import { SubcategoryModule } from '@src/modules/blog/subcategory/subcategory.module';
import { DynamoDbService } from '@src/services/dynamoDb.service';

/**
 * @module BlogModule
 * @description
 * Módulo principal do Blog.
 * Agrupa os submódulos do blog e provê o serviço DynamoDbService.
 * Exporta todos os submódulos e o DynamoDbService para que possam ser utilizados por outros módulos.
 *
 * @class BlogModule
 * @imports AuthorsModule, CategoryModule, CommentsModule, PostsModule, SubcategoryModule
 * @exports AuthorsModule, CategoryModule, CommentsModule, PostsModule, SubcategoryModule
 */
@Module({
  imports: [
    forwardRef(() => AuthorsModule),
    forwardRef(() => CategoryModule),
    forwardRef(() => CommentsModule),
    forwardRef(() => PostsModule),
    forwardRef(() => SubcategoryModule),
  ],
  providers: [DynamoDbService],
  exports: [
    forwardRef(() => AuthorsModule),
    forwardRef(() => CategoryModule),
    forwardRef(() => CommentsModule),
    forwardRef(() => PostsModule),
    forwardRef(() => SubcategoryModule),
    DynamoDbService,
  ],
})
export class BlogModule { }