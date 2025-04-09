import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Context, LambdaFunctionURLEvent } from 'aws-lambda'; // Correção aqui: LambdaFunctionUrlEvent (com 'l' minúsculo)
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { FastifyInstance, fastify } from 'fastify';
import { ApiSuccessResponseClass } from '@src/common/interceptors/response.interceptor'; // Importa o modelo
import fastifyCompress from '@fastify/compress';

// Define um tipo customizado para a resposta do inject
interface InjectResponse {
  statusCode: number;
  headers: Record<string, string | string[]>;
  body: string;
}

let cachedFastify: FastifyInstance | null = null;

async function bootstrapFastify(): Promise<FastifyInstance> {
  if (!cachedFastify) {
    const instance = fastify({
      logger: process.env.NODE_ENV === 'development',
      trustProxy: true,
    });

    await instance.register(fastifyCompress); // Ativa compressão HTTP

    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter(instance),
    );

    const configService = app.get(ConfigService);
    app.enableCors({
      origin: configService.get('CORS_ORIGIN', '*'),
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })
    );

    if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
      const swaggerConfig = new DocumentBuilder()
        .setTitle('API Portfolio')
        .setDescription('Documentação da API')
        .setVersion('1.0')
        .build();
      const document = SwaggerModule.createDocument(app, swaggerConfig, {
        extraModels: [ApiSuccessResponseClass], // Registra o modelo extra
      });
      SwaggerModule.setup('api', app, document);
    }

    await app.init();
    cachedFastify = instance;
  }
  return cachedFastify;
}

export const lambdaHandler = async (event: LambdaFunctionURLEvent) => {
  const fastifyInstance = await bootstrapFastify();

  // Definindo os métodos válidos como array "const"
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const;
  type ValidMethod = typeof validMethods[number];

  // Usa o método HTTP do requestContext
  const method = (event.requestContext?.http?.method ?? 'GET').toUpperCase();
  const safeMethod: ValidMethod = validMethods.includes(method as ValidMethod) ? method as ValidMethod : 'GET';

  // Forçamos a tipagem do retorno para o tipo customizado
  const response = (await fastifyInstance.inject({
    method: safeMethod,
    url: event.rawPath,
    headers: event.headers || {},
    payload: event.body || undefined,
  })) as unknown as InjectResponse;

  return {
    statusCode: response.statusCode || 500,
    headers: response.headers,
    body: response.body || '',
  };
};

if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  (async () => {
    const fastifyInstance = await bootstrapFastify();
    fastifyInstance.listen(
      { port: 4000, host: '0.0.0.0' },
      (err, address) => {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        console.log(`Servidor local: ${address}/api`);
      }
    );
  })();
}