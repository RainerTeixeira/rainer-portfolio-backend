import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';  // Caminho relativo
import { Handler, Callback, Context } from 'aws-lambda';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as serverless from 'aws-serverless-express';
import express from 'express'; // Importação do Express


let cachedServer: any;  // Variável para armazenar o servidor (usando 'any' para evitar erro de tipos)

async function bootstrapServer(): Promise<any> {  // Função assíncrona que inicializa o servidor
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);  // Adaptador NestJS para o Express
  const app = await NestFactory.create(AppModule, adapter); // Criação do app NestJS com Express
  app.enableCors();  // Habilitar CORS
  await app.init();  // Inicialização do app NestJS

  return serverless.createServer(expressApp);  // Criar o servidor serverless para AWS Lambda
}

// Exportando o handler para a AWS Lambda, responsável por manipular as requisições
export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  if (!cachedServer) {
    cachedServer = await bootstrapServer();  // Inicializa o servidor se não estiver em cache
  }

  // Retorna a resposta do servidor em formato promisso
  return serverless.proxy(cachedServer, event, context, 'PROMISE').promise;
};
