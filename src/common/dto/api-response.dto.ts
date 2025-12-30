/**
 * @fileoverview DTOs Padrão para Respostas da API
 * 
 * Define estruturas padronizadas para todas as respostas da API,
 * garantindo consistência e facilitando o consumo por clientes.
 * 
 * @module common/dto/api-response.dto
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

/**
 * DTO para resposta padrão da API.
 * 
 * Estrutura padronizada para todas as respostas de sucesso,
 * incluindo dados, metadados e informações de status.
 * 
 * @class ApiResponseDto
 * @template T Tipo dos dados retornados
 * 
 * @example
 * ```typescript
 * // Resposta com dados
 * const response: ApiResponseDto<User[]> = {
 *   success: true,
 *   message: 'Usuários encontrados',
 *   data: users,
 *   meta: {
 *     total: 100,
 *     page: 1,
 *     limit: 10,
 *     totalPages: 10
 *   }
 * };
 * 
 * // Resposta sem dados
 * const response: ApiResponseDto = {
 *   success: true,
 *   message: 'Operação realizada com sucesso'
 * };
 * ```
 */
export class ApiResponseDto<T = any> {
  /**
   * Indica se a operação foi bem-sucedida.
   * 
   * @type {boolean}
   */
  success!: boolean;

  /**
   * Mensagem descritiva do resultado.
   * 
   * @type {string}
   */
  message!: string;

  /**
   * Dados retornados pela operação (opcional).
   * 
   * @type {T}
   */
  data?: T;

  /**
   * Metadados da resposta (paginação, etc).
   * 
   * @type {object}
   */
  meta?: {
    /** Total de itens disponíveis */
    total?: number;
    /** Página atual */
    page?: number;
    /** Itens por página */
    limit?: number;
    /** Total de páginas */
    totalPages?: number;
  };
}

/**
 * DTO para resposta de erro.
 * 
 * Estrutura padronizada para todas as respostas de erro,
 * incluindo detalhes para debugging em ambiente de desenvolvimento.
 * 
 * @class ErrorDto
 * 
 * @example
 * ```typescript
 * const error: ErrorDto = {
 *   message: 'Recurso não encontrado',
 *   code: 'NOT_FOUND',
 *   timestamp: '2025-12-15T14:30:00.000Z',
 *   path: '/api/v1/posts/123'
 * };
 * ```
 */
export class ErrorDto {
  /**
   * Mensagem de erro amigável.
   * 
   * @type {string}
   */
  message!: string;

  /**
   * Código do erro para tratamento programático.
   * 
   * @type {string}
   */
  code?: string;

  /**
   * Detalhes adicionais do erro (apenas em desenvolvimento).
   * 
   * @type {any}
   */
  details?: any;

  /**
   * Timestamp do erro em formato ISO.
   * 
   * @type {string}
   */
  timestamp!: string;

  /**
   * Path da requisição que gerou o erro.
   * 
   * @type {string}
   */
  path!: string;
}

/**
 * DTO para informações de paginação.
 * 
 * Estrutura padronizada para respostas paginadas,
 * incluindo informações de navegação.
 * 
 * @class PaginationDto
 * 
 * @example
 * ```typescript
 * const pagination: PaginationDto = {
 *   page: 1,
 *   limit: 10,
 *   total: 150,
 *   totalPages: 15,
 *   hasNext: true,
 *   hasPrev: false
 * };
 * ```
 */
export class PaginationDto {
  /**
   * Número da página atual (inicia em 1).
   * 
   * @type {number}
   */
  page!: number;

  /**
   * Quantidade de itens por página.
   * 
   * @type {number}
   */
  limit!: number;

  /**
   * Total de itens disponíveis.
   * 
   * @type {number}
   */
  total!: number;

  /**
   * Total de páginas calculado.
   * 
   * @type {number}
   */
  totalPages!: number;

  /**
   * Indica se existe próxima página.
   * 
   * @type {boolean}
   */
  hasNext!: boolean;

  /**
   * Indica se existe página anterior.
   * 
   * @type {boolean}
   */
  hasPrev!: boolean;
}
