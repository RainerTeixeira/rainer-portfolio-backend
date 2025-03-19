import { Module, forwardRef } from '@nestjs/common';
import { PostsController } from './controllers/posts.controller';
import { PostsService } from './services/posts.service';
import { BlogModule } from '@src/modules/blog.module';
import { DynamoDbService } from '@src/services/dynamodb.service';
import { CategoryModule } from '@src/modules/blog/category/category.module';
import { AuthorsModule } from '@src/modules/blog/authors/authors.module';
import { CommentsModule } from '@src/modules/blog/comments/comments.module';
import { SubcategoryModule } from '@src/modules/blog/subcategory/subcategory.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        forwardRef(() => BlogModule),
        forwardRef(() => CategoryModule),
        forwardRef(() => SubcategoryModule),
        forwardRef(() => AuthorsModule),
        forwardRef(() => CommentsModule),
        ConfigModule.forRoot(),
    ],
    controllers: [PostsController],
    providers: [PostsService, DynamoDbService],
    exports: [PostsService],
})
export class PostsModule { }
