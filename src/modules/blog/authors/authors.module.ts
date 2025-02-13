import { Module } from '@nestjs/common';
import { AuthorsController } from './authors.controller';
import { AuthorsService } from './authors.service';
import { DynamoDbService } from '../../../services/dynamoDb.service'; // Importe o DynamoDbService

@Module({
    controllers: [AuthorsController],
    providers: [AuthorsService, DynamoDbService], // Adicione DynamoDbService como provider
})
export class AuthorsModule { }