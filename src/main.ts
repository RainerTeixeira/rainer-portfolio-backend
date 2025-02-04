import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Handler, Context, Callback, APIGatewayProxyEvent } from 'aws-lambda';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as serverless from 'aws-serverless-express';
import express from 'express';

// Cache do servidor para evitar inicializações desnecessárias no AWS Lambda
let cachedServer: any;

/**
 * Inicializa o servidor NestJS e o adapta para o AWS Lambda usando Express
 */
async function bootstrapServer(): Promise<any> {
  try {
    console.log('🔄 Inicializando o servidor...');
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    const app = await NestFactory.create(AppModule, adapter);
    app.enableCors(); // Permite requisições de diferentes origens (CORS)
    await app.init();

    console.log('✅ Servidor inicializado com sucesso!');
    return serverless.createServer(expressApp); // Criar servidor AWS Lambda
  } catch (error) {
    console.error('❌ Erro ao inicializar o servidor:', error);
    throw error;
  }
}

/**
 * Inicializa a aplicação localmente, rodando em http://localhost:3000
 */
async function bootstrapLocal() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  console.log('🚀 Aplicação rodando em http://localhost:3000');
}

/**
 * Handler da AWS Lambda: esta função será chamada quando o Lambda for acionado
 */
export const handler: Handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
  callback: Callback,
) => {
  try {
    // Se o servidor ainda não foi criado, inicializa ele
    if (!cachedServer) {
      console.log('⚡️ Servidor não encontrado em cache, inicializando...');
      cachedServer = await bootstrapServer();
    } else {
      console.log('♻️ Servidor encontrado em cache, reutilizando...');
    }

    console.log('🌍 Processando a requisição...');
    return serverless.proxy(cachedServer, event, context, 'PROMISE').promise;
  } catch (error) {
    console.error('❌ Erro ao processar requisição:', error);
    callback(error instanceof Error ? error : new Error(String(error)));
  }
};

/**
 * Se não estivermos rodando na AWS Lambda, inicializa o servidor localmente
 */
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  bootstrapLocal();
}
