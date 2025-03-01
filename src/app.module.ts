import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { BlogModule } from '@src/modules/blog.module';

@Module({
    imports: [
        CacheModule.register({
            ttl: 300, // 5 minutos
            max: 100, // Número máximo de itens no cache
            isGlobal: true, // Torna o cache disponível globalmente
        }),
        BlogModule,
    ],
    providers: [DynamoDbService],
    exports: [DynamoDbService],
})
export class AppModule { }