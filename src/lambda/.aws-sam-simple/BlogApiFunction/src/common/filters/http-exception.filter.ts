/**
 * @fileoverview Filtro Global de Exceções HTTP
 * 
 * Filtro responsável por capturar e padronizar todas as exceções
 * da aplicação, fornecendo respostas de erro consistentes
 * e informações úteis para debugging.
 * 
 * @module common/filters/http-exception.filter
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Filtro global para tratamento de exceções.
 * 
 * Captura todas as exceções lançadas na aplicação e as transforma
 * em respostas HTTP padronizadas, incluindo logging detalhado
 * e informações de contexto úteis para debugging.
 * 
 * Funcionalidades:
 * - Tratamento padronizado de HttpException
 * - Logging detalhado com stack trace
 * - Respostas consistentes para APIs REST
 * - Informações de contexto (path, método, timestamp)
 * - Detalhes adicionais apenas em desenvolvimento
 * 
 * @class AllExceptionsFilter
 * @implements ExceptionFilter
 * 
 * @example
 * ```typescript
 * // Registro no main.ts
 * app.useGlobalFilters(new AllExceptionsFilter());
 * ```
 * 
 * @since 1.0.0
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  /**
   * Logger para registro de exceções.
   * 
   * @private
   * @readonly
   * @type {Logger}
   */
  private readonly logger = new Logger(AllExceptionsFilter.name);

  /**
   * Método principal de captura de exceções.
   * 
   * Processa qualquer exceção lançada na aplicação e a transforma
   * em uma resposta HTTP padronizada com informações úteis.
   * 
   * @method catch
   * @param {unknown} exception - Exceção capturada
   * @param {ArgumentsHost} host - Host de contexto da requisição
   * @returns {void}
   * 
   * @example
   * ```typescript
   * // Exceção HttpException
   * catch(new NotFoundException('User not found'), host);
   * // Retorna: { statusCode: 404, message: 'User not found', ... }
   * 
   * // Exceção genérica
   * catch(new Error('Database connection failed'), host);
   * // Retorna: { statusCode: 500, message: 'Internal server error', ... }
   * ```
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status: number;
    let message: string;
    let details: any;

    /**
     * Tratamento específico para HttpException.
     * 
     * Extrai status code e mensagem da exceção HTTP,
     * mantendo compatibilidade com diferentes formatos
     * de resposta do NestJS.
     */
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        message = (exceptionResponse as any).message || exception.message;
        details = (exceptionResponse as any).details;
      }
    } else {
      /**
       * Tratamento para exceções genéricas.
       * 
       * Em produção, oculta detalhes da exceção por segurança.
       * Em desenvolvimento, inclui informações completas para debugging.
       */
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      details = process.env.NODE_ENV === 'development' ? exception : undefined;
    }

    /**
     * Logging detalhado do erro.
     * 
     * Registra informações completas para monitoramento
     * e debugging, incluindo stack trace quando disponível.
     */
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Error: ${message}`,
      exception instanceof Error ? exception.stack : exception,
    );

    /**
     * Construção da resposta de erro padronizada.
     * 
     * Inclui informações de contexto e detalhes adicionais
     * dependendo do ambiente (desenvolvimento vs produção).
     */
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && { 
        stack: exception instanceof Error ? exception.stack : undefined 
      }),
    };

    /**
     * Envio da resposta.
     * 
     * Define o status HTTP e envia o corpo da resposta
     * com a estrutura padronizada de erro.
     */
    response.status(status).send(errorResponse);
  }
}
