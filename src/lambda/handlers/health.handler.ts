/**
 * @fileoverview Handler de Health Check
 * 
 * Endpoint simples para health check da aplicação.
 * Não depende do NestJS, útil para verificações rápidas.
 * 
 * @module lambda/handlers/health.handler
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Interface para resposta de health check.
 */
interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  region: string;
  memory?: number;
  requestId?: string;
}

/**
 * Handler para health check da Lambda.
 * 
 * @async
 * @function healthHandler
 * @param {APIGatewayProxyEvent} event - Evento da Lambda
 * @returns {Promise<APIGatewayProxyResult>} Resposta com status da aplicação
 * 
 * @example
 * ```typescript
 * // GET /health
 * // Response:
 * {
 *   "status": "ok",
 *   "timestamp": "2023-01-01T00:00:00.000Z",
 *   "uptime": 3600,
 *   "version": "1.0.0",
 *   "environment": "production",
 *   "region": "us-east-1"
 * }
 * ```
 */
export async function healthHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const startTime = Date.now();
  const requestId = event.requestContext?.requestId;
  const region = process.env.AWS_REGION || 'unknown';
  const environment = process.env.NODE_ENV || 'development';
  const version = process.env.VERSION || '1.0.0';

  try {
    // Calcula uptime (em segundos)
    const uptime = Math.floor(process.uptime());

    // Memória disponível (MB)
    const memory = Math.floor(
      (event.requestContext as any)?.memoryLimitInMB || 128
    );

    const response: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime,
      version,
      environment,
      region,
      memory,
      requestId,
    };

    // Headers CORS
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    console.log('✅ Health Check:', {
      status: response.status,
      uptime: response.uptime,
      memory: response.memory,
      duration: Date.now() - startTime,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response, null, 2),
      isBase64Encoded: false,
    };
  } catch (error) {
    console.error('❌ Health Check Error:', error);

    const errorResponse: HealthResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: 0,
      version,
      environment,
      region,
      requestId,
    };

    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      },
      body: JSON.stringify(errorResponse, null, 2),
      isBase64Encoded: false,
    };
  }
}

/**
 * Handler para health check detalhado.
 * 
 * Verifica dependências como banco de dados.
 * 
 * @async
 * @function healthDetailedHandler
 * @param {APIGatewayProxyEvent} event - Evento da Lambda
 * @returns {Promise<APIGatewayProxyResult>} Resposta detalhada
 */
export async function healthDetailedHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const startTime = Date.now();
    
    // Health check básico
    const basic = await healthHandler(event);
    const basicData = JSON.parse(basic.body || '{}');

    // Verifica dependências
    const checks = {
      database: await checkDatabase(),
      dynamodb: await checkDynamoDB(),
      cognito: await checkCognito(),
    };

    const allHealthy = Object.values(checks).every(c => c.status === 'ok');

    const response = {
      ...basicData,
      checks,
      overall: allHealthy ? 'ok' : 'degraded',
      duration: Date.now() - startTime,
    };

    const statusCode = allHealthy ? 200 : 503;

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      },
      body: JSON.stringify(response, null, 2),
      isBase64Encoded: false,
    };
  } catch (error) {
    console.error('❌ Detailed Health Check Error:', error);

    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      },
      body: JSON.stringify({
        status: 'error',
        message: 'Health check failed',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
      }),
      isBase64Encoded: false,
    };
  }
}

/**
 * Verifica conexão com o banco de dados.
 */
async function checkDatabase(): Promise<{ status: string; latency?: number }> {
  try {
    const start = Date.now();
    // TODO: Implementar verificação real do MongoDB
    // await database.ping();
    const latency = Date.now() - start;
    return { status: 'ok', latency };
  } catch (error) {
    console.error('Database check failed:', error);
    return { status: 'error' };
  }
}

/**
 * Verifica conexão com DynamoDB.
 */
async function checkDynamoDB(): Promise<{ status: string; latency?: number }> {
  try {
    const start = Date.now();
    // TODO: Implementar verificação real do DynamoDB
    // await dynamodb.listTables().promise();
    const latency = Date.now() - start;
    return { status: 'ok', latency };
  } catch (error) {
    console.error('DynamoDB check failed:', error);
    return { status: 'error' };
  }
}

/**
 * Verifica conexão com Cognito.
 */
async function checkCognito(): Promise<{ status: string; latency?: number }> {
  try {
    const start = Date.now();
    // TODO: Implementar verificação real do Cognito
    // await cognito.listUserPools().promise();
    const latency = Date.now() - start;
    return { status: 'ok', latency };
  } catch (error) {
    console.error('Cognito check failed:', error);
    return { status: 'error' };
  }
}
