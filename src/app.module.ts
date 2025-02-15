// src/app.module.ts

import { Module } from '@nestjs/common'; // Importa o decorator Module do NestJS para definir o módulo principal da aplicação
import { DynamoDbService } from '@src/services/dynamoDb.service'; // Importa o DynamoDbService utilizando o alias @src (serviço para acesso ao DynamoDB)
import { BlogModule } from '@src/modules/blog.module';   // Importa o módulo principal do blog utilizando o alias @src

/**
 * Módulo principal da aplicação.
 * Aqui são importados os módulos essenciais, como o BlogModule, que já engloba os demais submódulos e provedores.
 * O DynamoDbService já é provido e exportado pelo BlogModule, portanto não é necessário adicioná-lo diretamente aqui.
 */
@Module({
    imports: [BlogModule], // Importa o BlogModule para disponibilizar os submódulos e funcionalidades do blog na aplicação
})
export class AppModule { }
