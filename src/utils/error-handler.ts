/**
 * Middleware de Erros
 * 
 * Middleware global para tratamento padronizado de erros.
 * 
 * @module utils/error-handler
 */

import type { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { ZodError } from 'zod';
import { logger } from './logger.js';

/**
 * Handler global de erros
 */
export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log do erro
  logger.error({
    err: error,
    req: {
      method: request.method,
      url: request.url,
    },
  }, 'Request error');

  // Erro de validação Zod
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: 'Erro de validação',
      details: error.errors,
    });
  }

  // Erro de validação Fastify
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: 'Erro de validação',
      details: error.validation,
    });
  }

  // Erro HTTP conhecido
  if (error.statusCode) {
    return reply.status(error.statusCode).send({
      success: false,
      error: error.message,
    });
  }

  // Erro interno
  return reply.status(500).send({
    success: false,
    error: 'Erro interno do servidor',
  });
}

