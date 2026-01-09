/**
 * @fileoverview Handler principal para Lambda Function URLs
 * 
 * Handler otimizado para AWS Lambda Function URLs (free tier).
 * Não utiliza API Gateway, processando diretamente requisições HTTP.
 * 
 * @module handlers/function-url.handler
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import { APIGatewayProxyEventV2, Context, APIGatewayProxyResultV2 } from 'aws-lambda';
import { ResponseBuilder } from '../utils/response-builder';
import { ErrorHandler } from '../utils/error-handler';

/**
 * Interface para evento Lambda Function URL
 */
interface FunctionURLEvent extends APIGatewayProxyEventV2 {
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
  };
}

/**
 * Handler principal para Lambda Function URLs
 */
export class FunctionURLHandler {
  /**
   * Processa requisições da Function URL
   */
  static async handler(event: FunctionURLEvent, context: Context): Promise<APIGatewayProxyResultV2> {
    const startTime = Date.now();

    try {
      // Log de entrada
      console.log('Function URL Request:', {
        requestId: context.awsRequestId,
        method: event.requestContext.http.method,
        path: event.requestContext.http.path,
        userAgent: event.requestContext.http.userAgent,
        sourceIp: event.requestContext.http.sourceIp,
        timestamp: new Date().toISOString(),
      });

      const method = event.requestContext.http.method;
      const path = event.requestContext.http.path;

      // CORS preflight
      if (method === 'OPTIONS') {
        return ResponseBuilder.cors();
      }

      // Health check endpoint
      if (path === '/health' || path === '/api/v1/health') {
        return ResponseBuilder.health();
      }

      // API endpoints
      if (path.startsWith('/api/')) {
        return await this.handleApiRequest(event, context);
      }

      // Default response
      return ResponseBuilder.success({
        message: 'Lambda Function URL is running',
        service: 'blog-api',
        version: process.env.VERSION || '1.0.0',
        endpoints: {
          health: '/health',
          api: '/api/v1/*',
        },
        documentation: 'https://github.com/RainerTeixeira/rainer-portfolio-backend',
      });

    } catch (error) {
      console.error('Function URL Error:', error);
      return ErrorHandler.handle(error);
    } finally {
      // Performance log
      const duration = Date.now() - startTime;
      console.log('Request completed:', {
        requestId: context.awsRequestId,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle API requests
   */
  private static async handleApiRequest(
    event: FunctionURLEvent, 
    context: Context
  ): Promise<APIGatewayProxyResultV2> {
    const path = event.requestContext.http.path;
    const method = event.requestContext.http.method;

    // Parse body se existir
    let body: any;
    if (event.body && event.headers?.['content-type']?.includes('application/json')) {
      try {
        body = JSON.parse(event.body);
      } catch (error) {
        return ErrorHandler.validation('Invalid JSON body');
      }
    }

    // Parse query parameters
    const query = event.queryStringParameters || {};

    // Routing simples baseado no path
    if (path === '/api/v1/users' && method === 'GET') {
      return ResponseBuilder.success({
        users: [],
        message: 'Users endpoint - TODO: Implement with NestJS integration',
      });
    }

    if (path === '/api/v1/posts' && method === 'GET') {
      return ResponseBuilder.success({
        posts: [],
        message: 'Posts endpoint - TODO: Implement with NestJS integration',
      });
    }

    // Endpoint não encontrado
    return ErrorHandler.notFound(`Endpoint ${method} ${path}`);
  }
}

// Export handler para Lambda
export const handler = FunctionURLHandler.handler.bind(FunctionURLHandler);
