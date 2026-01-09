/**
 * @fileoverview Utilitário para tratamento de erros em Lambda
 * 
 * Centraliza o tratamento de diferentes tipos de erros,
 * logando adequadamente e retornando respostas apropriadas.
 * 
 * @module utils/error-handler
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { ResponseBuilder } from './response-builder';

/**
 * Tipos de erros conhecidos
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  INTERNAL = 'INTERNAL',
}

/**
 * Classe de erro personalizada para Lambda
 */
export class LambdaError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public statusCode: number = 500,
    public details?: any,
  ) {
    super(message);
    this.name = 'LambdaError';
  }
}

/**
 * Handler centralizado de erros
 */
export class ErrorHandler {
  /**
   * Processa erros e retorna resposta apropriada
   */
  static handle(error: any): APIGatewayProxyResultV2 {
    // Log do erro completo em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        type: error.type,
        statusCode: error.statusCode,
        details: error.details,
      });
    } else {
      // Log simplificado em produção
      console.error('Error:', {
        name: error.name,
        message: error.message,
        type: error.type || ErrorType.INTERNAL,
      });
    }

    // Se é um LambdaError, usa as informações dele
    if (error instanceof LambdaError) {
      return ResponseBuilder.error(error.message, error.statusCode, {
        type: error.type,
        ...(error.details && { details: error.details }),
      });
    }

    // Erros conhecidos do AWS/Node.js
    if (error.name === 'ValidationError') {
      return ResponseBuilder.error(
        'Validation failed',
        400,
        { type: ErrorType.VALIDATION, details: error.details }
      );
    }

    if (error.name === 'UnauthorizedError') {
      return ResponseBuilder.error(
        'Unauthorized',
        401,
        { type: ErrorType.AUTHENTICATION }
      );
    }

    // Erro genérico
    return ResponseBuilder.error(
      'Internal server error',
      500,
      { type: ErrorType.INTERNAL }
    );
  }

  /**
   * Cria erro de validação
   */
  static validation(message: string, details?: any): LambdaError {
    return new LambdaError(
      ErrorType.VALIDATION,
      message,
      400,
      details
    );
  }

  /**
   * Cria erro de autenticação
   */
  static authentication(message: string = 'Authentication failed'): LambdaError {
    return new LambdaError(
      ErrorType.AUTHENTICATION,
      message,
      401
    );
  }

  /**
   * Cria erro de autorização
   */
  static authorization(message: string = 'Access denied'): LambdaError {
    return new LambdaError(
      ErrorType.AUTHORIZATION,
      message,
      403
    );
  }

  /**
   * Cria erro de recurso não encontrado
   */
  static notFound(resource: string = 'Resource'): LambdaError {
    return new LambdaError(
      ErrorType.NOT_FOUND,
      `${resource} not found`,
      404
    );
  }

  /**
   * Cria erro de lógica de negócio
   */
  static business(message: string, details?: any): LambdaError {
    return new LambdaError(
      ErrorType.BUSINESS_LOGIC,
      message,
      422,
      details
    );
  }

  /**
   * Cria erro de serviço externo
   */
  static external(message: string, service?: string): LambdaError {
    return new LambdaError(
      ErrorType.EXTERNAL_SERVICE,
      message,
      502,
      { service }
    );
  }
}
