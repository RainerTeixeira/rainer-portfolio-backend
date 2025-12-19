/**
 * @fileoverview Utilitários de Paginação
 *
 * Funções utilitárias para padronizar paginação em listagens.
 *
 * Objetivo:
 * - Centralizar o cálculo de `skip/offset`.
 * - Padronizar o payload retornado com metadados de paginação.
 * - Normalizar parâmetros (`page`, `limit`) vindos de query string.
 *
 * Observações:
 * - `page` é 1-indexado (página 1 é a primeira página).
 * - `limit` é limitado a 100 itens para evitar respostas muito grandes.
 *
 * @module utils/pagination
 */

/**
 * Metadados de paginação retornados junto com uma listagem.
 *
 * `totalPages` é derivado de `total` e `limit`.
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Calcula o `skip`/`offset` para consultas paginadas.
 *
 * @param {number} page Número da página (1-indexado).
 * @param {number} limit Quantidade de itens por página.
 * @returns {number} Quantidade de registros a pular.
 *
 * @example
 * ```ts
 * calculateSkip(1, 10) // 0
 * calculateSkip(2, 10) // 10
 * ```
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Cria um objeto `PaginationInfo` com base nos parâmetros e total.
 *
 * @param {number} page Número da página (1-indexado).
 * @param {number} limit Quantidade de itens por página.
 * @param {number} total Total de itens disponíveis.
 * @returns {PaginationInfo} Metadados calculados.
 *
 * @example
 * ```ts
 * createPaginationInfo(1, 10, 35)
 * // { page: 1, limit: 10, total: 35, totalPages: 4 }
 * ```
 */
export function createPaginationInfo(
  page: number,
  limit: number,
  total: number
): PaginationInfo {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Normaliza e valida parâmetros de paginação.
 *
 * Regras:
 * - `page` mínimo 1.
 * - `limit` mínimo 1 e máximo 100.
 *
 * @param {{ page?: number; limit?: number }} params Parâmetros brutos (ex.: query string).
 * @returns {{ page: number; limit: number }} Parâmetros normalizados.
 *
 * @example
 * ```ts
 * validatePaginationParams({ page: 0, limit: 999 })
 * // { page: 1, limit: 100 }
 * ```
 */
export function validatePaginationParams(params: { page?: number; limit?: number }) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 10));

  return { page, limit };
}

