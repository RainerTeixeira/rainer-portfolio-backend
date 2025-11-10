/**
 * Handler da AWS Lambda
 * 
 * Adaptador para rodar a aplicação Fastify no AWS Lambda.
 * Usa @fastify/aws-lambda para conversão automática.
 * 
 * @module lambda/handler
 */

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import awsLambdaFastify from '@fastify/aws-lambda';
import type { APIGatewayProxyEventV2, APIGatewayProxyResult, Context } from 'aws-lambda';
import { AppModule } from '../app.module.js';

/**
 * Constrói e exporta o handler Lambda.
 * O handler é inicializado apenas uma vez para melhor performance no Lambda.
 */

/**
 * Handler Fastify memoizado entre invocações Lambda.
 *
 * Durante o cold start, o NestJS e o adaptador Fastify são inicializados e o handler
 * resultante é armazenado em memória. Em invocações subsequentes (quente), o mesmo handler
 * é reutilizado para reduzir latência e custo de execução.
 */
let handler: ((event: APIGatewayProxyEventV2, context: Context) => Promise<APIGatewayProxyResult>) | undefined;

/**
 * Handler da AWS Lambda para requisições HTTP, integrando NestJS + Fastify via `@fastify/aws-lambda`.
 *
 * Em cold start, constrói a aplicação NestJS com `FastifyAdapter`, inicializa módulos e rotas,
 * e converte a instância Fastify em um handler compatível com API Gateway.
 * Nas execuções seguintes, reutiliza o handler previamente criado para performance.
 *
 * @param event - Evento recebido pelo Lambda. Em integrações HTTP, geralmente `APIGatewayProxyEventV2`.
 * @param context - Contexto de execução do Lambda, incluindo `awsRequestId`, `functionName`, etc.
 * @returns Resposta compatível com API Gateway (ex.: `APIGatewayProxyResult`) produzida pelo Fastify.
 *
 * @example
 * // Em ambiente de teste/local, simulando evento HTTP básico
 * await lambdaHandler({ rawPath: '/health', requestContext: { http: { method: 'GET' } } }, {});
 *
 * @remarks
 * - O adaptador `@fastify/aws-lambda` mapeia o evento do API Gateway para uma requisição Fastify.
 * - `app.init()` garante que providers e módulos NestJS estejam prontos antes de atender requisições.
 */
export const lambdaHandler = async (event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyResult> => {
  if (!handler) {
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter(),
    );
    await app.init();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler = awsLambdaFastify(app.getHttpAdapter().getInstance() as any) as (
      event: APIGatewayProxyEventV2,
      context: Context
    ) => Promise<APIGatewayProxyResult>;
  }

  return handler(event, context);
};

