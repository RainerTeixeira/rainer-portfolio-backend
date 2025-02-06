import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Context, APIGatewayProxyEvent } from 'aws-lambda';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import serverless from 'serverless-http';

let cachedServer: any; // Cache da instância do servidor

/**
 * Inicializa o servidor NestJS com Fastify para melhorar performance.
 */
async function bootstrapServer(): Promise<any> {
  if (!cachedServer) {
    console.log('⚡ Inicializando o servidor NestJS...');
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter(), // Usa Fastify no lugar de Express
    );

    app.enableCors(); // Ativa CORS, se necessário
    await app.init();

    cachedServer = serverless(app.getHttpAdapter().getInstance()); // Adapta para AWS Lambda
    console.log('✅ Servidor pronto!');
  }

  return cachedServer;
}

/**
 * Handler AWS Lambda: Executado a cada requisição
 */
export const handler = async (event: APIGatewayProxyEvent, context: Context) => {
  const server = await bootstrapServer();
  return server(event, context);
};

/**
 * Se não estiver rodando no AWS Lambda, inicializa o servidor localmente
 */
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  async function bootstrapLocal() {
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter(),
    );

    await app.listen(3000);
    console.log('🚀 Servidor rodando em http://localhost:3000');
  }

  bootstrapLocal();
}
