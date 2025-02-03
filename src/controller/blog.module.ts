import { Module } from '@nestjs/common';
import { PostsController } from '@src/controller/blog/posts/posts.controller';
import { PostsService } from '@src/controller/blog/posts/posts.service';
import { DynamoDbService } from '@src/services/dynamoDb';  // Verifique a importação correta

@Module({
    controllers: [PostsController],
    providers: [PostsService, DynamoDbService],
})
export class BlogModule { }
