import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { DynamoDbService } from '../../../services/dynamoDb.service'; // Importe o DynamoDbService

@Module({
    imports: [], // Remova a importação de DynamoDBModule, se você tinha antes
    controllers: [PostsController],
    providers: [PostsService, DynamoDbService], // Adicione DynamoDbService como provider
})
export class PostsModule { }