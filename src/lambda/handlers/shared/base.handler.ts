/**
 * @fileoverview Handler base para funções Lambda
 * 
 * Fornece funcionalidades comuns para todos os handlers Lambda:
 * - Parsing de eventos
 * - Middleware pipeline
 * - Error handling centralizado
 * - Logging estruturado
 * 
 * @module handlers/shared/base.handler
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import { APIGatewayProxyEventV2, Context, APIGatewayProxyResultV2 } from 'aws-lambda';
import { ResponseBuilder } from '../../utils/response-builder';
import { ErrorHandler, LambdaError } from '../../utils/error-handler';
import { LambdaConfig } from '../../config/lambda.config';

/**
 * Interface para middleware
 */
export interface Middleware {
  (event: APIGatewayProxyEventV2, context: Context): Promise<void> | void;
}

/**
 * Interface para handler function
 */
export interface HandlerFunction {
  (event: ParsedEvent, context: Context): Promise<any>;
}

/**
 * Evento parseado com informações extras
 */
export interface ParsedEvent {
  /**
   * Path parameters parseados
   */
  pathParameters?: Record<string, string>;

  /**
   * Query parameters parseados
   */
  queryStringParameters?: Record<string, string>;

  /**
   * Headers parseados (case-insensitive)
   */
  headers?: Record<string, string>;

  /**
   * Body parseado (JSON se aplicável)
   */
  body?: any;

  /**
   * Informações do request
   */
  requestContext: {
    requestId: string;
    stage: string;
    httpMethod: string;
    path: string;
    accountId?: string;
    apiId?: string;
    domainName?: string;
    time: string;
    timeEpoch: number;
  };

  /**
   * Propriedades originais do evento
   */
  rawPath?: string;
  rawQueryString?: string;
  routeKey?: string;
  version?: string;
}

/**
 * Handler base com funcionalidades comuns
 */
export abstract class BaseHandler {
  protected middlewares: Middleware[] = [];

  /**
   * Adiciona middleware ao pipeline
   */
  use(middleware: Middleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Parse do evento API Gateway
   */
  protected parseEvent(event: APIGatewayProxyEventV2): ParsedEvent {
    const parsedEvent: ParsedEvent = {
      pathParameters: event.pathParameters || undefined,
      queryStringParameters: event.queryStringParameters || undefined,
      headers: event.headers || undefined,
      body: undefined,
      requestContext: {
        requestId: event.requestContext?.requestId || this.generateRequestId(),
        stage: event.requestContext?.stage || 'local',
        httpMethod: event.requestContext?.http?.method || 'UNKNOWN',
        path: event.rawPath || '/',
        accountId: event.requestContext?.accountId,
        apiId: event.requestContext?.apiId,
        domainName: event.requestContext?.domainName,
        time: event.requestContext?.time || new Date().toISOString(),
        timeEpoch: event.requestContext?.timeEpoch || Date.now(),
      },
      rawPath: event.rawPath,
      rawQueryString: event.rawQueryString,
      routeKey: event.routeKey,
      version: event.version,
    };

    // Parse body JSON se existir
    if (event.body && event.headers?.['content-type']?.includes('application/json')) {
      try {
        parsedEvent.body = JSON.parse(event.body);
      } catch (error) {
        // Body não é JSON válido, mantém como string
        parsedEvent.body = event.body;
      }
    }

    return parsedEvent;
  }

  /**
   * Executa middleware pipeline
   */
  protected async executeMiddlewares(
    event: ParsedEvent,
    context: Context
  ): Promise<void> {
    for (const middleware of this.middlewares) {
      await middleware(event as unknown as APIGatewayProxyEventV2, context);
    }
  }

  /**
   * Handler principal com tratamento de erro
   */
  async handle(
    event: APIGatewayProxyEventV2,
    context: Context,
    handlerFunction: HandlerFunction
  ): Promise<APIGatewayProxyResultV2> {
    const startTime = Date.now();

    try {
      // Log de entrada
      this.logRequest(event, context);

      // Parse evento
      const parsedEvent = this.parseEvent(event);

      // Executar middlewares
      await this.executeMiddlewares(parsedEvent, context);

      // Executar handler específico
      const result = await handlerFunction(parsedEvent, context);

      // Log de performance
      const duration = Date.now() - startTime;
      this.logPerformance(parsedEvent, duration);

      // Retornar resposta
      return ResponseBuilder.success(result);

    } catch (error) {
      // Log de erro
      this.logError(error, event, context);

      // Tratar erro
      return ErrorHandler.handle(error);
    }
  }

  /**
   * Gera request ID único
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log de request
   */
  private logRequest(event: APIGatewayProxyEventV2, context: Context): void {
    if (LambdaConfig.logging.level !== 'none') {
      console.log('Request started:', {
        requestId: context.awsRequestId,
        method: event.requestContext?.http?.method,
        path: event.rawPath,
        userAgent: event.headers?.['user-agent'],
        ip: this.getClientIp(event),
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Log de performance
   */
  private logPerformance(event: ParsedEvent, duration: number): void {
    if (LambdaConfig.logging.enablePerformanceLogs) {
      console.log('Request completed:', {
        requestId: event.requestContext.requestId,
        method: event.requestContext.httpMethod,
        path: event.requestContext.path,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Log de erro
   */
  private logError(error: any, event: APIGatewayProxyEventV2, context: Context): void {
    console.error('Request failed:', {
      requestId: context.awsRequestId,
      method: event.requestContext?.http?.method,
      path: event.rawPath,
      error: {
        name: error.name,
        message: error.message,
        type: error.type,
        ...(LambdaConfig.logging.enableStackTrace && { stack: error.stack }),
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Obtém IP do cliente
   */
  private getClientIp(event: APIGatewayProxyEventV2): string {
    return (
      event.headers?.['x-forwarded-for'] ||
      event.headers?.['x-real-ip'] ||
      event.requestContext?.http?.sourceIp ||
      'unknown'
    );
  }
}
