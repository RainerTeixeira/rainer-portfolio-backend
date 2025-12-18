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

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { bootstrap } from './bootstrap/lambda.bootstrap';
import { functionUrlHandler, FunctionUrlEvent } from './function-url.handler';
import { healthHandler } from './handlers/health.handler';

/**
 * Cache da instância NestJS para warm starts.
 * 
 * @type {unknown}
 */
let app: unknown = null;

/**
 * Inicializa a aplicação NestJS.
 * 
 * Reutiliza a instância entre invocações para performance.
 * 
 * @async
 * @function initializeApp
 * @returns {Promise<unknown>} Instância do NestJS
 */
async function initializeApp(): Promise<unknown> {
  if (!app) {
    // eslint-disable-next-line no-console
    console.log(' Cold start - Inicializando NestJS...');
    app = await bootstrap();
    // eslint-disable-next-line no-console
    console.log(' NestJS inicializado com sucesso');
  } else {
    // eslint-disable-next-line no-console
    console.log(' Warm start - Reutilizando instância NestJS');
  }
  return app;
}

/**
 * Processa requisição através do NestJS.
 * 
 * @async
 * @function processWithNestJS
 * @param {APIGatewayProxyEvent} event - Evento formatado
 * @returns {Promise<APIGatewayProxyResult>} Resposta processada
 */
async function processWithNestJS(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const appInstance = await initializeApp();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fastify = (appInstance as any).getHttpAdapter().getInstance();

  // Monta URL completa
  let url = event.path;
  if (event.queryStringParameters) {
    const query = new URLSearchParams(event.queryStringParameters as Record<string, string>).toString();
    url += `?${query}`;
  }

  // Injeta requisição no Fastify
  const response = await fastify.inject({
    method: event.httpMethod,
    url: url,
    headers: event.headers,
    payload: event.body,
  });

  // Converte resposta
  return {
    statusCode: response.statusCode,
    headers: {
      ...response.headers,
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
    },
    body: response.payload,
    isBase64Encoded: false,
  };
}

/**
 * Handler principal da Lambda Function URL.
 * 
 * @async
 * @export
 * @function handler
 * @param {FunctionUrlEvent} event - Evento da Function URL
 * @returns {Promise<APIGatewayProxyResult>} Resposta HTTP
 * 
 * @example
 * ```typescript
 * // GET /api/v1/health
 * // Via curl:
 * curl https://lambda-url.execute-api.us-east-1.amazonaws.com/api/v1/health
 * ```
 */
export async function handler(
  event: FunctionUrlEvent
): Promise<APIGatewayProxyResult> {
  const startTime = Date.now();

  try {
    // Log da requisição
    // eslint-disable-next-line no-console
    console.log(' Lambda Request:', {
      method: event.requestContext.http.method,
      path: event.requestContext.http.path,
      userAgent: event.requestContext.http.userAgent,
      sourceIp: event.requestContext.http.sourceIp,
      requestId: event.requestContext.requestId,
    });

    // Health check direto (sem NestJS)
    if (event.requestContext.http.path === '/health') {
      // eslint-disable-next-line no-console
      console.log(' Health check direto (bypass NestJS)');
      const healthEvent: APIGatewayProxyEvent = {
        resource: '/health',
        path: '/health',
        httpMethod: 'GET',
        headers: event.headers,
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        stageVariables: null,
        requestContext: event.requestContext as unknown as APIGatewayProxyEvent['requestContext'],
        body: null,
        isBase64Encoded: false,
      };
      const response = await healthHandler(healthEvent);
      // eslint-disable-next-line no-console
      console.log(` Health check em ${Date.now() - startTime}ms`);
      return response;
    }

    // Processa via Function URL Handler
    return await functionUrlHandler(event, processWithNestJS);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(' Lambda Handler Error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
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

/**
 * Handler para execução local (desenvolvimento).
 * 
 * Inicia o servidor HTTP local para testes.
 * 
 * @async
 * @function runLocal
 * @returns {Promise<void>}
 * 
 * @example
 * ```typescript
 * // Executa localmente
 * await runLocal();
 * // Servidor disponível em http://localhost:4000
 * ```
 */
export async function runLocal(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(' Iniciando servidor local...');
  
  const appInstance = await initializeApp();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (appInstance as any).listen({
    port: parseInt(process.env.PORT || '4000', 10),
    host: process.env.HOST || '0.0.0.0',
  });
  
  // eslint-disable-next-line no-console
  console.log(` Servidor rodando em http://localhost:${process.env.PORT || 4000}`);
  // eslint-disable-next-line no-console
  console.log(' Health check: http://localhost:4000/health');
  // eslint-disable-next-line no-console
  console.log(' API docs: http://localhost:4000/docs');
  
  // Mantém o processo vivo indefinidamente
  await new Promise(() => {});
}

// Executa localmente se chamado diretamente
if (require.main === module) {
  runLocal().catch(console.error);
}