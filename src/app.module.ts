// src/app.module.ts

import { Module } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service'; // Import do DynamoDbService usando @src
import { BlogModule } from '@src/modules/blog.module';   // Import correto do BlogModule

@Module({
 imports: [BlogModule], // Importe o BlogModule aqui
})
export class AppModule { }