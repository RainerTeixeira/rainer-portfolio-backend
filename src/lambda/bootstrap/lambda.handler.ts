/**
 * @fileoverview Handler Lambda para NestJS
 * 
 * Wrapper que transforma eventos da AWS Lambda Function URL
 * em requisições HTTP compatíveis com o NestJS.
 * 
 * @module lambda/bootstrap/lambda.handler
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { bootstrap } from './lambda.bootstrap';

/**
 * Interface para evento da Lambda Function URL.
 * 
 * Diferente do API Gateway, a Function URL tem estrutura simplificada.
 */
interface FunctionUrlEvent {
  version: string;
  routeKey: string;
  rawPath: string;
  rawQueryString: string;
  cookies?: string[];
  headers: Record<string, string>;
  queryStringParameters?: Record<string, string>;
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
 * Handler principal da Lambda Function URL.
 * 
 * @async
 * @function lambdaHandler
 * @param {FunctionUrlEvent} event - Evento da Function URL
 * @returns {Promise<APIGatewayProxyResult>} Resposta HTTP
 * 
 * @example
 * ```typescript
 * // Exemplo de evento recebido
 * {
 *   "version": "2.0",
 *   "routeKey": "ANY /",
 *   "rawPath": "/api/v1/users",
 *   "rawQueryString": "page=1&limit=10",
 *   "headers": {
 *     "content-type": "application/json",
 *     "authorization": "Bearer token"
 *   },
 *   "body": "{\"name\":\"John\"}",
 *   "isBase64Encoded": false,
 *   "requestContext": {
 *     "http": {
 *       "method": "POST",
 *       "path": "/api/v1/users"
 *     }
 *   }
 * }
 * ```
 */
export async function lambdaHandler(
  event: FunctionUrlEvent
): Promise<APIGatewayProxyResult> {
  try {
    // eslint-disable-next-line no-console
    console.log('🚀 Lambda Function URL Event:', {
      method: event.requestContext.http.method,
      path: event.requestContext.http.path,
      query: event.queryStringParameters,
      userAgent: event.requestContext.http.userAgent,
    });

    // Converte evento Function URL para formato API Gateway
    const apiGatewayEvent: APIGatewayProxyEvent = {
      resource: event.requestContext.http.path,
      path: event.requestContext.http.path,
      httpMethod: event.requestContext.http.method,
      headers: event.headers,
      multiValueHeaders: {},
      queryStringParameters: event.rawQueryString ? Object.fromEntries(new URLSearchParams(event.rawQueryString)) : null,
      multiValueQueryStringParameters: null,
      pathParameters: null,
      stageVariables: null,
      requestContext: {
        accountId: event.requestContext.accountId,
        apiId: event.requestContext.apiId,
        domainName: event.requestContext.domainName,
        domainPrefix: event.requestContext.domainPrefix,
        httpMethod: event.requestContext.http.method,
        path: event.requestContext.http.path,
        protocol: event.requestContext.http.protocol,
        requestId: event.requestContext.requestId,
        requestTime: new Date().toISOString(),
        requestTimeEpoch: event.requestContext.timeEpoch,
        resourceId: event.requestContext.apiId,
        resourcePath: event.requestContext.http.path,
        stage: event.requestContext.stage,
        identity: {
          accessKey: null,
          accountId: null,
          apiKey: null,
          apiKeyId: null,
          caller: null,
          cognitoAuthenticationProvider: null,
          cognitoAuthenticationType: null,
          cognitoIdentityId: null,
          cognitoIdentityPoolId: null,
          principalOrgId: null,
          sourceIp: event.requestContext.http.sourceIp,
          user: null,
          userAgent: event.requestContext.http.userAgent,
          userArn: null,
          clientCert: null,
        },
        authorizer: event.requestContext.authorizer || {
          principalId: '',
        },
      },
      body: event.body || null,
      isBase64Encoded: event.isBase64Encoded,
    };

    // Inicializa aplicação NestJS
    const app = await bootstrap();

    // Simula requisição HTTP no NestJS
    const fastify = app.getHttpAdapter().getInstance();
    const queryString = event.rawQueryString ? event.rawQueryString : (event.queryStringParameters ? '?' + new URLSearchParams(event.queryStringParameters as Record<string, string>).toString() : '');
    const response = await fastify.inject({
      method: apiGatewayEvent.httpMethod,
      url: apiGatewayEvent.path + queryString,
      headers: apiGatewayEvent.headers,
      payload: apiGatewayEvent.body,
    });

    // Converte resposta do Fastify para API Gateway
    const result: APIGatewayProxyResult = {
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

    // eslint-disable-next-line no-console
    console.log('✅ Lambda Response:', {
      statusCode: result.statusCode,
      contentLength: result.body?.length || 0,
    });

    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Lambda Error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      },
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
      }),
      isBase64Encoded: false,
    };
  }
}
