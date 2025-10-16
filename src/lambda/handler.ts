/**
 * AWS Lambda Handler
 * 
 * Adaptador para rodar a aplicação Fastify no AWS Lambda.
 * Usa @fastify/aws-lambda para conversão automática.
 * 
 * @module lambda/handler
 */

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import awsLambdaFastify from '@fastify/aws-lambda';
import { AppModule } from '../app.module.js';

/**
 * Constrói e exporta o handler Lambda.
 * O handler é inicializado apenas uma vez para melhor performance no Lambda.
 */

let handler: any;

export const lambdaHandler = async (event: any, context: any) => {
  if (!handler) {
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter(),
    );
    await app.init();
    handler = awsLambdaFastify(app.getHttpAdapter().getInstance() as any);
  }

  return handler(event, context);
};

