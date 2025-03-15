import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * @class HttpExceptionFilter
 * @classdesc Filtro de exceção global para capturar e formatar erros HTTP.
 * Este filtro captura todas as instâncias de HttpException, registra os detalhes do erro e envia uma resposta formatada ao cliente.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * @inheritdoc
   * @param {unknown} exception - A exceção capturada.
   * @param {ArgumentsHost} host - O host de argumentos fornecido pelo NestJS.
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse: any = exception instanceof HttpException ? exception.getResponse() : exception;

    const error = typeof exceptionResponse === 'string' ? { message: exceptionResponse } : exceptionResponse;

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: error.message || 'Erro inesperado',
      error: error.error || 'Internal Server Error',
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Message: ${errorResponse.message} - Error: ${errorResponse.error}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    if (typeof response.status === 'function') {
      response.status(status).json(errorResponse);
    } else {
      this.logger.error('Response object does not have a status method');
    }
  }
}
