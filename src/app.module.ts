// src/app.module.ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DynamoDbService } from './services/dynamoDb.service'; // Importe o DynamoDbService
import { BlogModule } from './modules/blog/blog.module'; // Importe o BlogModule

@Module({
  imports: [BlogModule], // Importe o BlogModule aqui
  controllers: [AppController],
  providers: [AppService, DynamoDbService], // Declare o DynamoDbService como provider global
})
export class AppModule { }