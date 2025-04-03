import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { FastifyInstance, fastify } from 'fastify';

// Cache para a instância do Fastify
let cachedFastify: FastifyInstance | null = null;

async function bootstrapFastify(): Promise<FastifyInstance> {
  if (!cachedFastify) {
    // 1. Cria instância do Fastify
    const instance = fastify({
      logger: process.env.NODE_ENV === 'development',
      trustProxy: true,
    });

    // 2. Configura o NestJS
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter(instance),
    );

    // 3. Configurações gerais
    const configService = app.get(ConfigService);

    app.enableCors({
      origin: configService.get('CORS_ORIGIN', '*'),
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })
    );

    // 4. Swagger apenas para ambiente local
    if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
      const config = new DocumentBuilder()
        .setTitle('API Portfolio')
        .setDescription('Documentação da API')
        .setVersion('1.0')
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api', app, document);
    }

    await app.init();
    cachedFastify = instance;
  }

  return cachedFastify;
}

// Handler otimizado para Lambda
export const handler = async (event: APIGatewayProxyEvent, context: Context) => {
  const fastifyInstance = await bootstrapFastify();

  // Converte o evento Lambda para requisição HTTP
  const response = await fastifyInstance.inject({
    method: event.httpMethod,
    url: event.path,
    headers: event.headers || {},
    payload: event.body,
  });

  // Formata a resposta para o formato Lambda
  return {
    statusCode: response.statusCode,
    headers: response.headers,
    body: response.body,
  };
};

// Código para execução local
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