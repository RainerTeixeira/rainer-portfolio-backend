import { Module } from '@nestjs/common';
import { BlogModule } from '@src/controller/blog.module';  // Importando o BlogModule com o alias configurado
import { AuthModule } from '@src/auth/cognito';                  // Importando o AuthModule
import { dynamoDBClient } from '@src/services/dynamoDb';         // Importando o cliente DynamoDB

@Module({
  imports: [
    BlogModule,  // Inclui o BlogModule com todas as funcionalidades do blog (posts, autores, etc.)
    AuthModule,  // Inclui o AuthModule para autenticação
  ],
  controllers: [], // Se houver controladores globais, adicione-os aqui
  providers: [
    { provide: 'DYNAMODB_CLIENT', useValue: dynamoDBClient }, // Fornecendo o cliente DynamoDB globalmente.
  ],
})
export class AppModule { }
