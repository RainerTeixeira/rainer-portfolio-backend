// src/app.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { memoryStore } from 'cache-manager';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { BlogModule } from '@src/modules/blog.module';

@Module({
    imports: [
        CacheModule.register({
            store: memoryStore,
            ttl: 300, // 5 minutos
            max: 100,
            isGlobal: true,
        }),
        BlogModule,
    ],
    providers: [DynamoDbService],
    exports: [DynamoDbService],
})
export class AppModule { }