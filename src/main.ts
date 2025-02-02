import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Handler } from 'aws-lambda';
import { Callback, Context } from 'aws-lambda/handler';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as serverless from 'aws-serverless-express';
import express from 'express'; // Importação padrão

let cachedServer: any;  // Alterado para 'any' para evitar o erro

async function bootstrapServer(): Promise<any> {  // Alterado para 'any'
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(AppModule, adapter);
  app.enableCors();
  await app.init();
  return serverless.createServer(expressApp);
}

export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  if (!cachedServer) {
    cachedServer = await bootstrapServer();
  }

  return serverless.proxy(cachedServer, event, context, 'PROMISE').promise;
};
