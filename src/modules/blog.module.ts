// src/controller/blog.module.ts
import { Module } from '@nestjs/common';
import { PostsController } from './posts/posts.controller';
import { PostsService } from './posts/posts.service';
import dynamoDBClient from '../../services/dynamoDb';

@Module({
  controllers: [PostsController],
  providers: [
    PostsService,
    {
      provide: 'DYNAMODB_CLIENT',
      useValue: dynamoDBClient,
    },
  ],
})
export class BlogModule { }