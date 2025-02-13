import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { DynamoDbService } from '../../../services/dynamoDb.service'; // Importe o DynamoDbService

@Module({
    imports: [], // Remova a importação de DynamoDBModule, se você tinha antes
    controllers: [CommentsController],
    providers: [CommentsService, DynamoDbService], // Adicione DynamoDbService como provider
})
export class CommentsModule { }