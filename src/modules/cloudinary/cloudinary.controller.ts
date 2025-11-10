/**
 * Controlador de Cloudinary
 * 
 * Controller para endpoints de upload de imagens para o blog.
 * 
 * @module modules/cloudinary/cloudinary.controller
 */

import {
  Controller,
  Post,
  UseInterceptors,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { CloudinaryService } from './cloudinary.service.js';
import { FastifyFileInterceptor, type FastifyUploadedFile } from '../users/interceptors/fastify-file.interceptor.js';

/**
 * Controller de Cloudinary para upload de imagens do blog.
 *
 * Convenções de resposta:
 * - Retorno padronizado em sucesso com `{ success: true, url, fullUrl? }`.
 * - Validação de tipo e tamanho via interceptor Fastify.
 *
 * Integração Swagger:
 * - `@ApiTags`, `@ApiOperation`, `@ApiConsumes`, `@ApiBody`, `@ApiResponse` com exemplos.
 *
 */
@ApiTags('📸 Cloudinary')
@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  /**
   * Upload de imagem para o blog
   * 
   * Endpoint para upload de imagens que serão usadas nos posts do blog.
   * As imagens são otimizadas para WebP e retornam apenas a URL.
   */
  @Post('upload/blog-image')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    new FastifyFileInterceptor('image', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB para imagens do blog
      fileFilter: (file: FastifyUploadedFile) => {
        return !!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/);
      },
    })
  )
  @ApiOperation({
    summary: '📤 Upload de Imagem para Blog',
    description: 'Faz upload de imagem otimizada para Cloudinary. Retorna apenas a URL otimizada em WebP. Máximo 5MB.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem (JPG, PNG, GIF, WebP - Máximo 5MB)',
        },
      },
      required: ['image'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Upload realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        url: {
          type: 'string',
          example: 'https://res.cloudinary.com/dkt0xccga/image/upload/v1234567890/blog/image_id.webp',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Erro na validação ou upload' })
  async uploadBlogImage(@Req() request: FastifyRequest) {
    const file = (request as unknown as { file?: FastifyUploadedFile }).file;

    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    try {
      // Obter fileName do FormData (campo adicional no multipart)
      // No Fastify, campos adicionais vêm em request.body como array de partes
      let fileName: string | undefined;
      const body = (request as unknown as { body?: unknown }).body;
      
      if (Array.isArray(body)) {
        // Procurar campo 'fileName' no array de partes do multipart
        interface MultipartPart {
          fieldname?: string;
          value?: unknown;
        }
        const fileNamePart = (body as MultipartPart[]).find((part) => part.fieldname === 'fileName');
        if (fileNamePart && fileNamePart.value) {
          fileName = String(fileNamePart.value);
        }
      } else if (body && typeof body === 'object' && body !== null && 'fileName' in body) {
        fileName = String((body as { fileName?: unknown }).fileName);
      }
      
      if (!fileName) {
        fileName = file.filename;
      }

      // Converter FastifyUploadedFile para formato compatível
      const expressFile = {
        fieldname: file.fieldname,
        originalname: file.filename,
        encoding: file.encoding,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
        destination: '',
        filename: file.filename,
        path: '',
        stream: null as never,
      };

      // Gerar public_id baseado no fileName fornecido
      // Formato: blog/imagem_teste (sem extensão, sem redundância)
      // O Cloudinary salvará como WebP automaticamente
      let publicId: string;
      let fileNameWithoutExt: string;
      
      if (fileName) {
        // Remover espaços e caracteres especiais, manter apenas alfanuméricos, hífens e underscores
        const sanitized = fileName
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .toLowerCase();
        
        // Remover extensão se existir (o Cloudinary converte para WebP automaticamente)
        fileNameWithoutExt = sanitized.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
        
        // Usar apenas o nome sem extensão (Cloudinary adiciona .webp automaticamente)
        publicId = `blog/${fileNameWithoutExt}`;
      } else {
        // Fallback: usar timestamp se não houver fileName
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        fileNameWithoutExt = `imagem_${timestamp}_${random}`;
        publicId = `blog/${fileNameWithoutExt}`;
      }
      
      // Upload para Cloudinary (será salvo como blog/nome_arquivo.webp)
      const imageUrl = await this.cloudinaryService.uploadImage(
        expressFile,
        'blog',
        publicId
      );

      // Retornar URL curta no formato: /blog/nome_arquivo (sem extensão)
      // O frontend pode construir a URL completa do Cloudinary quando necessário
      // ou usar o formato curto para referência simples
      const shortUrl = `/blog/${fileNameWithoutExt}`;

      return {
        success: true,
        url: shortUrl, // URL curta: /blog/nome_arquivo
        fullUrl: imageUrl, // URL completa do Cloudinary (para referência)
      };
    } catch (error) {
      const err = error as Error;
      throw new BadRequestException(`Erro ao fazer upload: ${err.message}`);
    }
  }

  /**
   * Upload de avatar do usuário
   * 
   * Endpoint para upload de avatares que serão usados nos perfis.
   * As imagens são otimizadas para 512x512px WebP e retornam apenas a URL.
   */
  @Post('upload/avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    new FastifyFileInterceptor('image', {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB para avatares
      fileFilter: (file: FastifyUploadedFile) => {
        return !!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/);
      },
    })
  )
  @ApiOperation({
    summary: '📤 Upload de Avatar',
    description: 'Faz upload de avatar otimizado para Cloudinary. Retorna apenas a URL otimizada em WebP (512x512px). Máximo 2MB.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem (JPG, PNG, GIF, WebP - Máximo 2MB)',
        },
      },
      required: ['image'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Upload realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        url: {
          type: 'string',
          example: 'https://res.cloudinary.com/dkt0xccga/image/upload/v1234567890/avatars/avatar_id.webp',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Erro na validação ou upload' })
  async uploadAvatar(@Req() request: FastifyRequest) {
    const file = (request as unknown as { file?: FastifyUploadedFile }).file;

    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    try {
      // Converter FastifyUploadedFile para formato compatível
      const expressFile = {
        fieldname: file.fieldname,
        originalname: file.filename,
        encoding: file.encoding,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
        destination: '',
        filename: file.filename,
        path: '',
        stream: null as never,
      };

      // Upload para Cloudinary com otimização para avatar
      // Usar pasta 'avatars' e gerar public_id único baseado em timestamp
      // Formato: avatars/{timestamp}-{random} para garantir unicidade
      // O CloudinaryService detecta automaticamente 'avatars' e aplica 512x512px
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 9);
      const publicId = `avatars/${timestamp}-${random}`;
      
      const imageUrl = await this.cloudinaryService.uploadImage(
        expressFile,
        'avatars',
        publicId
      );

      return {
        success: true,
        url: imageUrl, // Apenas a URL otimizada
      };
    } catch (error) {
      const err = error as Error;
      throw new BadRequestException(`Erro ao fazer upload: ${err.message}`);
    }
  }
}

