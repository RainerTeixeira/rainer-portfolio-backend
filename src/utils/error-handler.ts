/**
 * @fileoverview Handler Global de Erros (Fastify)
 *
 * Handler global para tratamento padronizado de erros em uma aplicação Fastify.
 *
 * Responsabilidades:
 * - Centralizar logging do erro e do contexto básico da requisição.
 * - Mapear erros de validação (Zod e validação nativa do Fastify) para HTTP 400.
 * - Responder erros HTTP conhecidos respeitando `error.statusCode`.
 * - Garantir fallback para erro interno (HTTP 500) com resposta consistente.
 *
 * Observações:
 * - Este handler é tipado como função assíncrona pois pode ser usado em hooks
 *   e configurações do Fastify que aceitam `async`.
 * - A resposta segue uma estrutura simples com `success: false` e campos
 *   `error`/`details` quando aplicável.
 *
 * @module utils/error-handler
 */

import type { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { ZodError } from 'zod';
import { logger } from './logger';

/**
 * Handler global de erros.
 *
 * Ordem de decisão:
 * 1. Loga o erro + contexto de request.
 * 2. Se for `ZodError`, retorna 400 com `details: error.errors`.
 * 3. Se for erro de validação do Fastify (`error.validation`), retorna 400.
 * 4. Se existir `error.statusCode`, retorna esse status com mensagem.
 * 5. Caso contrário, retorna 500 com mensagem genérica.
 *
 * @async
 * @param {FastifyError} error Erro interceptado pelo Fastify.
 * @param {FastifyRequest} request Request atual.
 * @param {FastifyReply} reply Reply para envio da resposta.
 * @returns {Promise<unknown>} Retorno do `reply.send(...)`.
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

