// src/modules/blog/posts/posts.module.ts
import { Module } from '@nestjs/common';
import { PostsController } from '@src/modules/blog/posts/posts.controller';
import { PostsService } from '@src/modules/blog/posts/posts.service';''
import { DynamoDbService } from '@src/services/dynamoDb.service';

@Module({
    controllers: [PostsController],
    providers: [PostsService, DynamoDbService],
})
export class PostsModule { }
