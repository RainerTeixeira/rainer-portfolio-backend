import { Module } from '@nestjs/common';
import { SubcategoriesController } from './subcategories.controller';
import { SubcategoriesService } from './subcategories.service';
import { DynamoDbService } from '../../../services/dynamoDb.service'; // Importe o DynamoDbService

@Module({
    imports: [], // Remova a importação de DynamoDBModule, se você tinha antes
    controllers: [SubcategoriesController],
    providers: [SubcategoriesService, DynamoDbService], // Adicione DynamoDbService como provider
})
export class SubcategoriesModule { }