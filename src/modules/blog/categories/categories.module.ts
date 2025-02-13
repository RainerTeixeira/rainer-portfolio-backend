import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { DynamoDbService } from '../../../services/dynamoDb.service'; // Importe o DynamoDbService

@Module({
    imports: [], // Remova a importação de DynamoDBModule, se você tinha antes
    controllers: [CategoriesController],
    providers: [CategoriesService, DynamoDbService], // Adicione DynamoDbService como provider
})
export class CategoriesModule { }