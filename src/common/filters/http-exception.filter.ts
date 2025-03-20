// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { Request } from 'express'; // Importe o tipo Request do express para melhor tipagem

/**
 * @class HttpExceptionFilter
 * @description Filtro global para tratamento de exceções HTTP.
 * Captura exceções do tipo HttpException e formata a resposta HTTP para incluir detalhes do erro,
 * como código de status, mensagem, timestamp e o caminho da requisição.
 * Também registra os erros usando o Logger do NestJS.
 * @implements {ExceptionFilter<HttpException>}
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * @param exception A exceção HttpException capturada.
   * @param host Host de argumentos para o contexto HTTP. Permite acessar o objeto de requisição e resposta.
   * @returns void
   */
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<Request>(); // Use o tipo Request importado
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    let error: { message: string | string; statusCode?: number } = { message: 'Erro desconhecido' };

    if (typeof exceptionResponse === 'string') {
      error = { message: exceptionResponse };
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      error = exceptionResponse as { message: string | string; statusCode?: number };
    }

    this.logger.error(
      `Exceção HTTP: Status ${status}, Erro: ${JSON.stringify(error)}`,
      exception.stack,
    );

    response.status(status).send({
      ...error,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  /**
   * @private
   * @param exception Exceção capturada (pode ser HttpException ou Error).
   * @returns Um objeto contendo a mensagem, o tipo do erro e, opcionalmente, o stack trace.
   */
  private getErrorDetails(exception: unknown): {
    message: string;
    error: string;
    stack?: string;
  } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      return {
        message:
          typeof response === 'object' && response !== null && 'message' in response
            ? (response as { message: string }).message
            : response.toString(),
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
   * @private
   * @param exception Exceção capturada (pode ser HttpException ou outro tipo).
   * @returns O código de status HTTP correspondente à exceção.
   */
  private getHttpStatus(exception: unknown): number {
    return exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * @private
   * @param request Objeto de requisição HTTP.
   * @param status Código de status HTTP do erro.
   * @param errorDetails Objeto contendo detalhes da mensagem e tipo do erro.
   * @returns void
   */
  private logError(
    request: Request,
    status: number,
    errorDetails: { message: string; error: string },
  ): void {
    const logMessage = `${request.method} ${request.url} [${status}] ${errorDetails.error}: ${errorDetails.message}`;

    if (status >= 500) {
      this.logger.error(logMessage);
    } else {
      this.logger.warn(logMessage);
    }
  }
}
