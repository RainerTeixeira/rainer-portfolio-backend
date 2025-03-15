// http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * @class HttpExceptionFilter
 * @description Filtro global para tratamento de exceções HTTP
 * @implements ExceptionFilter
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * Método principal para tratamento de exceções
   * @param exception Exceção capturada
   * @param host Host de argumentos para contexto HTTP
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.getHttpStatus(exception);
    const errorDetails = this.getErrorDetails(exception);

    this.logError(request, status, errorDetails);

    response.status(status).json({
      success: false,
      statusCode: status,
      message: errorDetails.message,
      error: errorDetails.error,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(process.env.NODE_ENV !== 'production' && { stack: errorDetails.stack }),
    });
  }

  /**
   * Extrai detalhes do erro de forma segura
   * @param exception Exceção capturada
   * @returns Objeto com detalhes do erro
   */
  private getErrorDetails(exception: unknown): {
    message: string;
    error: string;
    stack?: string;
  } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      return {
        message: typeof response === 'object' ? (response as any).message : response.toString(),
        error: HttpStatus[exception.getStatus()],
        stack: exception.stack,
      };
    }

    if (exception instanceof Error) {
      return {
        message: exception.message,
        error: 'Internal Server Error',
        stack: exception.stack,
      };
    }

    return {
      message: 'Erro desconhecido',
      error: 'Internal Server Error',
    };
  }

  /**
   * Determina o status HTTP adequado para a exceção
   * @param exception Exceção capturada
   * @returns Código de status HTTP
   */
  private getHttpStatus(exception: unknown): number {
    return exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Registra erros de forma padronizada
   * @param request Objeto de requisição
   * @param status Código de status HTTP
   * @param errorDetails Detalhes do erro
   */
  private logError(
    request: Request,
    status: number,
    errorDetails: { message: string; error: string },
  ) {
    const logMessage = `${request.method} ${request.url} [${status}] ${errorDetails.error}: ${errorDetails.message}`;

    status >= 500
      ? this.logger.error(logMessage)
      : this.logger.warn(logMessage);
  }
}