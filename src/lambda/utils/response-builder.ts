/**
 * @fileoverview Utilitário para construir respostas HTTP padronizadas em Lambda
 * 
 * Centraliza a criação de respostas HTTP com headers padrão,
 * formatação CORS e tratamento de erros.
 * 
 * @module utils/response-builder
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import { APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * Headers padrão para todas as respostas
 */
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Database-Provider',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Max-Age': '86400',
};

/**
 * Builder para respostas HTTP padronizadas
 */
export class ResponseBuilder {
  /**
   * Cria resposta de sucesso
   */
  static success<T>(data: T, statusCode: number = 200): APIGatewayProxyResultV2 {
    return {
      statusCode,
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      }),
    };
  }

  /**
   * Cria resposta de erro
   */
  static error(
    message: string,
    statusCode: number = 500,
    error?: any,
  ): APIGatewayProxyResultV2 {
    return {
      statusCode,
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        success: false,
        error: {
          message,
          ...(process.env.NODE_ENV === 'development' && { details: error }),
        },
        timestamp: new Date().toISOString(),
      }),
    };
  }

  /**
   * Resposta para CORS preflight
   */
  static cors(): APIGatewayProxyResultV2 {
    return {
      statusCode: 200,
      headers: DEFAULT_HEADERS,
      body: '',
    };
  }

  /**
   * Resposta de health check
   */
  static health(): APIGatewayProxyResultV2 {
    return this.success({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.VERSION || '1.0.0',
    });
  }

  /**
   * Resposta paginada
   */
  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): APIGatewayProxyResultV2 {
    return this.success({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  }
}
