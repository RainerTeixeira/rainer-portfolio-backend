/**
 * @fileoverview Conversor de Evento Function URL
 * 
 * Transforma eventos da AWS Lambda Function URL no formato
 * esperado pelo NestJS/Fastify. Lida com headers, body,
 * query params e path parameters.
 * 
 * @module lambda/function-url.handler
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Interface do evento da Lambda Function URL v2.0.
 * 
 * Mais simples que o API Gateway, sem transformações desnecessárias.
 */
export interface FunctionUrlEvent {
  version: '2.0';
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
 * Cache para path parameters extraídos.
 * 
 * Otimização para evitar reprocessamento da mesma rota.
 */
const pathParamsCache = new Map<string, Record<string, string>>();

/**
 * Converte evento da Function URL para API Gateway.
 * 
 * @function convertFunctionUrlToApiGateway
 * @param {FunctionUrlEvent} event - Evento da Function URL
 * @returns {APIGatewayProxyEvent} Evento compatível com API Gateway
 * 
 * @example
 * ```typescript
 * // Evento Function URL:
 * {
 *   "version": "2.0",
 *   "routeKey": "ANY /api/v1/users/{id}",
 *   "rawPath": "/api/v1/users/123",
 *   "rawQueryString": "include=posts",
 *   "headers": { "content-type": "application/json" },
 *   "body": "{\"name\":\"John\"}",
 *   "requestContext": {
 *     "http": { "method": "PUT", "path": "/api/v1/users/123" }
 *   }
 * }
 * 
 * // Convertido para API Gateway:
 * {
 *   "version": "1.0",
 *   "httpMethod": "PUT",
 *   "path": "/api/v1/users/123",
 *   "pathParameters": { "id": "123" },
 *   "queryStringParameters": { "include": "posts" },
 *   "body": "{\"name\":\"John\"}"
 * }
 * ```
 */
export function convertFunctionUrlToApiGateway(
  event: FunctionUrlEvent
): APIGatewayProxyEvent {
  // Extrai path parameters da rota
  const pathParameters = extractPathParameters(
    event.routeKey.split(' ')[1] || '',
    event.rawPath
  );

  // Monta query string se necessário
  let queryString = event.rawQueryString;
  if (!queryString && event.queryStringParameters) {
    queryString = new URLSearchParams(event.queryStringParameters).toString();
  }

  // Converte headers para lowercase (padrão API Gateway)
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(event.headers)) {
    headers[key.toLowerCase()] = value;
  }

  // Adiciona headers importantes
  headers['x-forwarded-proto'] = 'https';
  headers['x-forwarded-port'] = '443';
  headers['x-forwarded-host'] = event.requestContext.domainName;
  headers['x-amzn-trace-id'] = event.requestContext.requestId;

  // Monta o evento no formato API Gateway
  const apiGatewayEvent: APIGatewayProxyEvent = {
    resource: event.requestContext.http.path,
    path: event.requestContext.http.path,
    httpMethod: event.requestContext.http.method,
    headers,
    multiValueHeaders: {},
    queryStringParameters: queryString ? Object.fromEntries(new URLSearchParams(queryString)) : null,
    multiValueQueryStringParameters: null,
    pathParameters: Object.keys(pathParameters).length > 0 ? pathParameters : null,
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
      authorizer: event.requestContext.authorizer ? {
        claims: event.requestContext.authorizer.jwt.claims,
        scopes: event.requestContext.authorizer.jwt.scopes,
      } : undefined,
    },
    body: event.body || null,
    isBase64Encoded: event.isBase64Encoded,
  };

  return apiGatewayEvent;
}

/**
 * Extrai parâmetros de path da rota.
 * 
 * @function extractPathParameters
 * @param {string} routePattern - Padrão da rota (ex: "/users/{id}")
 * @param {string} actualPath - Path real (ex: "/users/123")
 * @returns {Record<string, string>} Parâmetros extraídos
 * 
 * @example
 * ```typescript
 * extractPathParameters("/users/{id}/posts/{postId}", "/users/123/posts/456")
 * // Retorna: { id: "123", postId: "456" }
 * ```
 */
function extractPathParameters(
  routePattern: string,
  actualPath: string
): Record<string, string> {
  // Cache key
  const cacheKey = `${routePattern}:${actualPath}`;
  
  // Verifica cache
  if (pathParamsCache.has(cacheKey)) {
    return pathParamsCache.get(cacheKey)!;
  }

  const params: Record<string, string> = {};

  // Divide em segmentos
  const routeSegments = routePattern.split('/').filter(Boolean);
  const pathSegments = actualPath.split('/').filter(Boolean);

  // Extrai parâmetros
  for (let i = 0; i < routeSegments.length; i++) {
    const routeSegment = routeSegments[i];
    const pathSegment = pathSegments[i];

    // Verifica se é um parâmetro {param}
    if (routeSegment.startsWith('{') && routeSegment.endsWith('}')) {
      const paramName = routeSegment.slice(1, -1);
      if (pathSegment) {
        params[paramName] = pathSegment;
      }
    }
  }

  // Salva no cache
  pathParamsCache.set(cacheKey, params);

  return params;
}

/**
 * Converte resposta do NestJS para API Gateway.
 * 
 * @function convertResponseToApiGateway
 * @param {any} response - Resposta do Fastify/NestJS
 * @returns {APIGatewayProxyResult} Resposta formatada
 */
export function convertResponseToApiGateway(response: any): APIGatewayProxyResult {
  const headers = {
    ...response.headers,
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
  };

  return {
    statusCode: response.statusCode || 200,
    headers,
    body: typeof response.payload === 'string' 
      ? response.payload 
      : JSON.stringify(response.payload || {}),
    isBase64Encoded: false,
  };
}

/**
 * Limpa o cache de path parameters.
 * 
 * Útil para evitar memory leak em longas execuções.
 */
export function clearPathParamsCache(): void {
  pathParamsCache.clear();
}

/**
 * Handler principal que orquestra a conversão.
 * 
 * @export
 * @async
 * @function functionUrlHandler
 * @param {FunctionUrlEvent} event - Evento da Function URL
 * @param {Function} nestHandler - Handler do NestJS
 * @returns {Promise<APIGatewayProxyResult>} Resposta processada
 */
export async function functionUrlHandler(
  event: FunctionUrlEvent,
  nestHandler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>
): Promise<APIGatewayProxyResult> {
  try {
    // Log do evento recebido
    // eslint-disable-next-line no-console
    console.log(' Function URL Handler - Route not found:', event.requestContext.http.path);
    console.log('📥 Function URL Event:', {
      method: event.requestContext.http.method,
      path: event.requestContext.http.path,
      routeKey: event.routeKey,
      hasBody: !!event.body,
      hasQuery: !!event.queryStringParameters,
      hasAuth: !!event.requestContext.authorizer,
    });

    // Converte evento
    const apiGatewayEvent = convertFunctionUrlToApiGateway(event);

    // Processa com NestJS
    const response = await nestHandler(apiGatewayEvent);

    // Converte resposta
    return convertResponseToApiGateway(response);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(' Function URL Handler Error:', error);

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
