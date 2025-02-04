import { Module } from '@nestjs/common';
import { PostsController } from './blog/posts/posts.controller';
import { PostsService } from './blog/posts/posts.service';
import { dynamoDBClient } from '../services/dynamoDb';

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
export class BlogModule {}
