/**
 * @fileoverview Handler Principal AWS Lambda
 * 
 * Entry point para AWS Lambda Function URL.
 * Orquestra o bootstrap do NestJS e processa requisições.
 * 
 * @module lambda/handler
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import type { APIGatewayProxyResultV2, Context } from 'aws-lambda';
import awsLambdaFastify from '@fastify/aws-lambda';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { LambdaAppModule } from './lambda-app.module';
import { applyGlobalAppConfig } from '../common/bootstrap/app.bootstrap';

export interface FunctionUrlEvent {
  version: '2.0';
  routeKey: string;
  rawPath: string;
  rawQueryString: string;
  cookies?: string[];
  headers: Record<string, string>;
  body?: string;
  isBase64Encoded: boolean;
  requestContext: {
    accountId: string;
    apiId: string;
    domainName: string;
    domainPrefix: string;
    requestId: string;
    routeKey: string;
    stage: string;
    time: string;
    timeEpoch: number;
    http: {
      method: string;
      path: string;
      protocol: string;
      sourceIp: string;
      userAgent: string;
    };
    authorizer?: {
      jwt: {
        claims: Record<string, string>;
        scopes: string[];
      };
    };
  };
}

/**
 * Cache da instância NestJS para warm starts.
 * 
 * @type {INestApplication | null}
 */
const isProd = process.env.NODE_ENV === 'production';

function logInfo(message: string, data?: unknown): void {
  console.log(message, data ?? '');
}

function logError(message: string, data?: unknown): void {
  console.error(message, data ?? '');
}

let app: INestApplication | null = null;
let proxy: ((event: unknown, context: Context) => Promise<APIGatewayProxyResultV2>) | null = null;

async function bootstrap(): Promise<INestApplication> {
  if (app) {
    return app;
  }

  const adapter = new FastifyAdapter();
  const instance = await NestFactory.create(LambdaAppModule, adapter, {
    logger: isProd ? ['error'] : ['error', 'warn'],
  });

  await applyGlobalAppConfig(instance);

  await instance.init();

  instance.enableShutdownHooks();

  app = instance;
  return app;
}

/**
 * Health check direto (bypass NestJS) - máximo performance.
 */
async function healthHandler(event: FunctionUrlEvent): Promise<APIGatewayProxyResultV2> {
  const requestId = event.requestContext?.requestId;
  const region = process.env.AWS_REGION || 'unknown';
  const environment = process.env.NODE_ENV || 'development';
  const version = process.env.VERSION || '1.0.0';

  try {
    const response = {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version,
      environment,
      region,
      requestId,
    };

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-cache, no-store, must-revalidate',
        pragma: 'no-cache',
        expires: '0',
        'access-control-allow-origin': process.env.CORS_ORIGIN || '*',
        'access-control-allow-methods': 'GET',
        'access-control-allow-headers': 'Content-Type',
      },
      body: JSON.stringify(response),
      isBase64Encoded: false,
    };
  } catch (error) {
    if (!isProd) {
      logError(
        ' Health Check Error:',
        {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          requestId,
        },
      );
    }

    return {
      statusCode: 503,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': process.env.CORS_ORIGIN || '*',
      },
      body: JSON.stringify({
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: 0,
        version,
        environment,
        region,
        requestId,
      }),
      isBase64Encoded: false,
    };
  }
}

/**
 * Inicializa a aplicação NestJS.
 * 
 * Reutiliza a instância entre invocações para performance.
 * 
 * @async
 * @function initializeApp
 * @returns {Promise<INestApplication>} Instância do NestJS
 */
async function initializeApp(): Promise<INestApplication> {
  if (!app) {
    logInfo(' Cold start - Inicializando NestJS...');
    app = await bootstrap();
    logInfo(' NestJS inicializado com sucesso');
  } else {
    logInfo(' Warm start - Reutilizando instância NestJS');
  }
  return app;
}

/**
 * Processa requisição através do NestJS.
 * 
 * @async
 * @function processWithNestJS
 * @param {FunctionUrlEvent} event - Evento da Function URL
 * @param {Context} context - Contexto da Lambda
 * @returns {Promise<APIGatewayProxyResultV2>} Resposta processada
 */
async function processWithNestJS(
  event: FunctionUrlEvent,
  context: Context,
): Promise<APIGatewayProxyResultV2> {
  const appInstance = await initializeApp();
  const fastify = (appInstance as any).getHttpAdapter().getInstance();

  if (!proxy) {
    proxy = awsLambdaFastify(fastify);
  }

  const result = await proxy(event, context);

  if (typeof result === 'string') {
    return {
      statusCode: 200,
      headers: {
        'access-control-allow-origin': process.env.CORS_ORIGIN || '*',
        'access-control-allow-credentials': 'true',
      },
      body: result,
    };
  }

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(result.headers || {})) {
    headers[key] = String(value);
  }

  if (!headers['access-control-allow-origin']) {
    headers['access-control-allow-origin'] = process.env.CORS_ORIGIN || '*';
  }

  if (!headers['access-control-allow-credentials']) {
    headers['access-control-allow-credentials'] = 'true';
  }

  return {
    ...result,
    headers,
  };
}

/**
 * Handler principal da Lambda Function URL.
 * 
 * @async
 * @export
 * @function handler
 * @param {FunctionUrlEvent} event - Evento da Function URL
 * @param {Context} context - Contexto da Lambda
 * @returns {Promise<APIGatewayProxyResultV2>} Resposta HTTP
 * 
 * @example
 * ```typescript
 * // GET /api/v1/health
 * // Via curl:
 * curl https://lambda-url.execute-api.us-east-1.amazonaws.com/api/v1/health
 * ```
 */
export async function handler(
  event: FunctionUrlEvent,
  context: Context,
): Promise<APIGatewayProxyResultV2> {
  const startTime = Date.now();

  context.callbackWaitsForEmptyEventLoop = false;

  try {

    // Log da requisição
    logInfo(' Lambda Request:', {
      method: event.requestContext.http.method,
      path: event.requestContext.http.path,
      userAgent: event.requestContext.http.userAgent,
      sourceIp: event.requestContext.http.sourceIp,
      requestId: event.requestContext.requestId,
    });

    const method = event.requestContext.http.method;
    const path = event.requestContext.http.path;

    // Health check direto (sem NestJS)
    if (path === '/health') {
      logInfo(' Health check direto (bypass NestJS)');
      const response = await healthHandler(event);
      logInfo(` Health check em ${Date.now() - startTime}ms`);
      return response;
    }

    // CORS preflight direto (sem NestJS)
    if (method === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: {
          'access-control-allow-origin': process.env.CORS_ORIGIN || '*',
          'access-control-allow-credentials': 'true',
          'access-control-allow-methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
          'access-control-allow-headers':
            (event.headers &&
              (event.headers['access-control-request-headers'] ||
                event.headers['Access-Control-Request-Headers'])) ||
            'Content-Type,Authorization,X-Requested-With',
        },
        body: '',
        isBase64Encoded: false,
      };
    }

    // Processa via NestJS/Fastify
    return await processWithNestJS(event, context);
  } catch (error) {
    logError(
      ' Lambda Handler Error:',
      isProd
        ? {
            duration: Date.now() - startTime,
            requestId: event.requestContext.requestId,
          }
        : {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            duration: Date.now() - startTime,
            requestId: event.requestContext.requestId,
          },
    );

    return {
      statusCode: 500,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': process.env.CORS_ORIGIN || '*',
      },
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
        requestId: event.requestContext.requestId,
      }),
      isBase64Encoded: false,
    };
  }
}

export const lambdaHandler = handler;