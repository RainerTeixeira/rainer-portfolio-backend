import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller'; // Caminho relativo
import { PostsService } from './posts.service'; // Caminho relativo
import { DynamoDbModule } from '@src/services/dynamoDb.service';

/**
 * Módulo responsável pela gestão de posts do blog, incluindo operações CRUD.
 */
@Module({
    imports: [DynamoDbModule], // Fornece acesso ao DynamoDB
    controllers: [PostsController], // Controladores das rotas
    providers: [PostsService], // Serviço com lógica de negócio
})
export class PostsModule { }