import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { DynamoDbService } from '@src/services/dynamoDb.service';

@Module({
    providers: [PostsService, DynamoDbService],
    controllers: [PostsController],
})
export class PostsModule { }