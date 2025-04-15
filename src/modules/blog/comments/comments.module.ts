import { Module } from '@nestjs/common';
import { DynamoDbModule } from '@src/services/dynamoDb.service';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentsRepository } from './comments.repository';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
    imports: [
        DynamoDbModule,
        CacheModule.register({
            ttl: 300, // 5 minutos
            max: 100 // Limite de itens em cache
        })
    ],
    controllers: [CommentsController],
    providers: [
        CommentsService,
        CommentsRepository
    ],
    exports: [CommentsService]
})
export class CommentsModule { }