// handler.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Context, APIGatewayProxyEvent } from 'aws-lambda';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import serverless from 'serverless-http';

// Cache para armazenar a instância do servidor entre execuções Lambda
let cachedServer: any;

// Helper para tratamento seguro de mensagens de erro
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

// Helper para logging detalhado de erros
function logError(error: unknown): void {
  if (error instanceof Error) {
    console.error('Erro:', error.stack || error.message);
  } else {
    console.error('Erro desconhecido:', error);
  }
}

/**
 * Inicializa ou retorna a instância do servidor NestJS com Fastify
 * @returns Promise com o servidor configurado para uso no Lambda
 */
async function bootstrapServer(): Promise<any> {
  if (!cachedServer) {
    console.log('⚡ Inicializando o servidor NestJS...');

    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter({ logger: true }),
    );

    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    });

    await app.init();

    cachedServer = serverless(app.getHttpAdapter().getInstance() as any);
    console.log('✅ Servidor inicializado e pronto para requisições!');
  }

  return cachedServer;
}

/**
 * Handler principal para execução no AWS Lambda
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
) => {
  try {
    const server = await bootstrapServer();
    const response = await server(event, context);

    response.headers = {
      ...response.headers,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    };

    return response;
  } catch (error: unknown) {
    logError(error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development'
          ? getErrorMessage(error)
          : 'Contate o suporte técnico',
        timestamp: new Date().toISOString(),
        requestId: context.awsRequestId,
      }),
    };
  }
};

/**
 * Configuração para execução local
 */
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  async function bootstrapLocal() {
    console.log('🚀 Iniciando servidor local...');

    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter(),
    );

    await app.listen(3000, '0.0.0.0', () => {
      console.log(`🔌 Servidor ouvindo em http://localhost:3000`);
      console.log(`📚 Documentação Swagger em http://localhost:3000/api`);
    });
  }

  bootstrapLocal().catch(error => {
    logError(error);
    process.exit(1);
  });
}