/**
 * Pagination
 * 
 * Utilitários para paginação de listagens.
 * 
 * @module utils/pagination
 */

/**
 * Interface de paginação
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Calcula skip/offset para paginação
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Cria objeto de paginação
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
 * Valida parâmetros de paginação
 */
export function validatePaginationParams(params: { page?: number; limit?: number }) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 10));

  return { page, limit };
}

