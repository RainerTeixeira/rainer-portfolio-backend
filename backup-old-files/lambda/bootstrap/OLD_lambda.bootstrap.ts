import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Server } from 'http';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import serverlessExpress from '@vendia/serverless-express';
import { AllExceptionsFilter } from '../common/filters/http-exception.filter';

let cachedServer: Server;

/**
 * Cria e inicializa o servidor NestJS uma vez
 * para reutilização entre invocações (cold start optimization)
 */
async function bootstrapServer(): Promise<Server> {
  if (!cachedServer) {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    
    const app = await NestFactory.create(AppModule, adapter, {
      logger: ['error', 'warn'], // Reduz logs em produção
    });

    // Configurações específicas para Lambda
    app.enableCors({
      origin: '*',
      credentials: true,
    });
    
    // Adiciona filtro global de exceções
    app.useGlobalFilters(new AllExceptionsFilter());
    
    // Inicializa microservices se necessário
    // await app.init();
    
    await app.init();
    
    cachedServer = serverlessExpress({ app });
  }
  
  return cachedServer;
}

export { bootstrapServer };
