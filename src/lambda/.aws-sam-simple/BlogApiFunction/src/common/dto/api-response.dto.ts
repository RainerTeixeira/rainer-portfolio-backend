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

import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({
    description: 'Indica se a operação foi bem-sucedida',
    example: true,
  })
  success!: boolean;

  /**
   * Mensagem descritiva do resultado.
   * 
   * @type {string}
   */
  @ApiProperty({
    description: 'Mensagem descritiva do resultado',
    example: 'Operação realizada com sucesso',
  })
  message!: string;

  /**
   * Dados retornados pela operação (opcional).
   * 
   * @type {T}
   */
  @ApiProperty({
    description: 'Dados retornados pela operação',
    required: false,
  })
  data?: T;

  /**
   * Metadados da resposta (paginação, etc).
   * 
   * @type {object}
   */
  @ApiProperty({
    description: 'Metadados da resposta (paginação, etc)',
    required: false,
  })
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
  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Recurso não encontrado',
  })
  message!: string;

  /**
   * Código do erro para tratamento programático.
   * 
   * @type {string}
   */
  @ApiProperty({
    description: 'Código do erro',
    example: 'NOT_FOUND',
    required: false,
  })
  code?: string;

  /**
   * Detalhes adicionais do erro (apenas em desenvolvimento).
   * 
   * @type {any}
   */
  @ApiProperty({
    description: 'Detalhes do erro (apenas em desenvolvimento)',
    required: false,
  })
  details?: any;

  /**
   * Timestamp do erro em formato ISO.
   * 
   * @type {string}
   */
  @ApiProperty({
    description: 'Timestamp do erro',
    example: '2025-12-15T14:30:00.000Z',
  })
  timestamp!: string;

  /**
   * Path da requisição que gerou o erro.
   * 
   * @type {string}
   */
  @ApiProperty({
    description: 'Path da requisição',
    example: '/api/v1/posts/123',
  })
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
  @ApiProperty({
    description: 'Número da página atual',
    example: 1,
    minimum: 1,
  })
  page!: number;

  /**
   * Quantidade de itens por página.
   * 
   * @type {number}
   */
  @ApiProperty({
    description: 'Itens por página',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  limit!: number;

  /**
   * Total de itens disponíveis.
   * 
   * @type {number}
   */
  @ApiProperty({
    description: 'Total de itens',
    example: 150,
  })
  total!: number;

  /**
   * Total de páginas calculado.
   * 
   * @type {number}
   */
  @ApiProperty({
    description: 'Total de páginas',
    example: 15,
  })
  totalPages!: number;

  /**
   * Indica se existe próxima página.
   * 
   * @type {boolean}
   */
  @ApiProperty({
    description: 'Indica se existe próxima página',
    example: true,
  })
  hasNext!: boolean;

  /**
   * Indica se existe página anterior.
   * 
   * @type {boolean}
   */
  @ApiProperty({
    description: 'Indica se existe página anterior',
    example: false,
  })
  hasPrev!: boolean;
}
