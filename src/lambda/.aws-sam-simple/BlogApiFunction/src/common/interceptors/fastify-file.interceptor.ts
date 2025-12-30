/**
 * @fileoverview Interceptor de Upload de Arquivo (Fastify + NestJS)
 *
 * Este arquivo contém um interceptor customizado para NestJS, pensado para ser
 * utilizado quando a aplicação roda com `@nestjs/platform-fastify` +
 * `@fastify/multipart`.
 *
 * Motivação:
 * - O NestJS possui interceptors prontos para Express (Multer), mas em Fastify
 *   o fluxo de multipart é diferente.
 * - Aqui fazemos a leitura do stream de upload e materializamos o arquivo em
 *   memória (`Buffer`) para que controllers/services possam consumir de forma
 *   similar ao padrão do Express.
 *
 * Como funciona (alto nível):
 * - Detecta se a request é multipart via `request.isMultipart()`.
 * - Itera as partes via `request.parts()`.
 * - Para a parte `file` cujo `fieldname` coincide com o campo configurado,
 *   lê o buffer completo e valida tamanho/tipo.
 * - Para partes `field`, acumula os valores em um objeto `body`.
 * - Injeta o arquivo em `(request as any).file` e mescla o `body` extraído em
 *   `(request as any).body`.
 *
 * Observações importantes:
 * - **Este interceptor lê o arquivo inteiro em memória**. Para uploads grandes
 *   ou múltiplos arquivos, considere estratégia streaming.
 * - Em caso de erro de parsing/validação, lança `BadRequestException`.
 *
 * @module common/interceptors/fastify-file.interceptor
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { FastifyRequest } from 'fastify';

/**
 * Representa um arquivo já processado pelo interceptor.
 *
 * Esta estrutura é uma “ponte” entre o multipart do Fastify e o consumo comum
 * em handlers (controllers/services). O campo `buffer` contém o arquivo inteiro.
 */
export interface FastifyUploadedFile {
  fieldname: string;
  filename: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

/**
 * Interceptor para processar upload de **um único arquivo** via Fastify Multipart.
 *
 * O interceptor:
 * - Localiza o arquivo pelo nome do campo (`fieldName`).
 * - Faz validações opcionais (`limits.fileSize`, `fileFilter`).
 * - Injeta o arquivo em `request.file`.
 * - Mescla os demais campos do formulário em `request.body`.
 *
 * @class FastifyFileInterceptor
 * @implements NestInterceptor
 */
@Injectable()
export class FastifyFileInterceptor implements NestInterceptor {
  /**
   * Cria uma instância do interceptor.
   *
   * @param {string} fieldName Nome do campo do multipart que contém o arquivo.
   * @param {object} [options] Opções de validação do upload.
   * @param {object} [options.limits] Limites do upload.
   * @param {number} [options.limits.fileSize] Tamanho máximo em bytes.
   * @param {(file: FastifyUploadedFile) => boolean} [options.fileFilter]
   * Função para aceitar/rejeitar o arquivo com base em metadados (ex.: mimetype).
   */
  constructor(
    private readonly fieldName: string,
    private readonly options?: {
      limits?: { fileSize?: number };
      fileFilter?: (file: FastifyUploadedFile) => boolean;
    }
  ) {}

  /**
   * Intercepta a requisição para extrair e validar o multipart.
   *
   * Se a requisição **não** for multipart, o interceptor não faz nada e apenas
   * delega para o próximo handler.
   *
   * @async
   * @param {ExecutionContext} context Contexto de execução do NestJS.
   * @param {CallHandler} next Próximo handler na cadeia.
   * @returns {Promise<Observable<any>>} Observable resultante do próximo handler.
   */
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    // Se houver dados multipart, processar
    if (request.isMultipart()) {
      try {
        const body: Record<string, any> = {};
        let avatarFile: FastifyUploadedFile | undefined;

        // Processar todos os partes do multipart
        const parts = request.parts();
        
        for await (const part of parts) {
          if (part.type === 'file') {
            // É um arquivo
            if (part.fieldname === this.fieldName) {
              // Ler o buffer completo do arquivo
              const buffer = await part.toBuffer();
              
              // Criar objeto compatível com Express.Multer.File
              const file: FastifyUploadedFile = {
                fieldname: part.fieldname,
                filename: part.filename || '',
                encoding: part.encoding,
                mimetype: part.mimetype,
                buffer,
                size: buffer.length,
              };

              // Validar tamanho
              if (this.options?.limits?.fileSize && file.size > this.options.limits.fileSize) {
                throw new BadRequestException(`Arquivo muito grande. Máximo ${this.options.limits.fileSize / (1024 * 1024)}MB`);
              }

              // Validar tipo de arquivo (se fileFilter fornecido)
              if (this.options?.fileFilter) {
                if (!this.options.fileFilter(file)) {
                  throw new BadRequestException('Tipo de arquivo não permitido');
                }
              }

              avatarFile = file;
            }
          } else {
            // É um campo de formulário
            body[part.fieldname] = part.value;
          }
        }

        // Adicionar arquivo ao request
        if (avatarFile) {
          (request as any).file = avatarFile;
        }

        // Mesclar campos do body com o body existente
        if (Object.keys(body).length > 0) {
          (request as any).body = {
            ...((request as any).body || {}),
            ...body,
          };
        }
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        const err = error as Error;
        throw new BadRequestException(`Erro ao processar arquivo: ${err.message}`);
      }
    }

    return next.handle();
  }
}

/**
 * Factory function para criar `FastifyFileInterceptor`.
 *
 * Útil para manter um padrão de criação e facilitar import/uso.
 *
 * @param {string} fieldName Nome do campo do multipart que contém o arquivo.
 * @param {object} [options] Opções de validação do upload.
 * @returns {FastifyFileInterceptor} Instância do interceptor.
 *
 * @example
 * ```ts
 * @UseInterceptors(new FastifyFileInterceptor('avatar', {
 *   limits: { fileSize: 2 * 1024 * 1024 },
 *   fileFilter: (file) => file.mimetype.startsWith('image/'),
 * }))
 * ```
 */
export function FastifyFile(fieldName: string, options?: {
  limits?: { fileSize?: number };
  fileFilter?: (file: FastifyUploadedFile) => boolean;
}) {
  return new FastifyFileInterceptor(fieldName, options);
}

