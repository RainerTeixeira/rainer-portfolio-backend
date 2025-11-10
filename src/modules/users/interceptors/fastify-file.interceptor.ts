/**
 * Fastify File Interceptor
 * 
 * Interceptor customizado para upload de arquivos usando @fastify/multipart
 * 
 * @module modules/users/interceptors/fastify-file.interceptor
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
 * Interface para arquivo processado
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
 * Interceptor para processar upload de arquivo único usando Fastify Multipart
 */
@Injectable()
export class FastifyFileInterceptor implements NestInterceptor {
  constructor(
    private readonly fieldName: string,
    private readonly options?: {
      limits?: { fileSize?: number };
      fileFilter?: (file: FastifyUploadedFile) => boolean;
    }
  ) {}

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
 * Factory function para criar FastifyFileInterceptor
 */
export function FastifyFile(fieldName: string, options?: {
  limits?: { fileSize?: number };
  fileFilter?: (file: FastifyUploadedFile) => boolean;
}) {
  return new FastifyFileInterceptor(fieldName, options);
}

