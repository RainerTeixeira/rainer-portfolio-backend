/**
 * Serviço de Cloudinary
 * 
 * Serviço para upload e gerenciamento de imagens no Cloudinary
 * com otimização WebP automática e máxima compressão.
 * 
 * @module modules/cloudinary/cloudinary.service
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {
    // Configurar Cloudinary a partir da variável de ambiente (síncrono e rápido)
    try {
      const cloudinaryUrl = this.configService.get<string>('CLOUDINARY_URL');
      
      if (!cloudinaryUrl) {
        this.logger.warn('CLOUDINARY_URL não configurada. Upload de imagens estará desabilitado.');
        return;
      }

      // Parse da URL do Cloudinary: cloudinary://api_key:api_secret@cloud_name
      const urlMatch = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
      
      if (urlMatch) {
        const [, apiKey, apiSecret, cloudName] = urlMatch;
        cloudinary.config({
          cloud_name: cloudName.trim(),
          api_key: apiKey.trim(),
          api_secret: apiSecret.trim(),
          secure: true, // Usar HTTPS
        });
        this.logger.log(`Cloudinary configurado: cloud_name=${cloudName.trim()}`);
      } else {
        // Fallback: tentar usar a URL diretamente via variável de ambiente
        process.env.CLOUDINARY_URL = cloudinaryUrl;
        cloudinary.config({
          secure: true,
        });
        this.logger.warn('Cloudinary configurado via CLOUDINARY_URL (parse manual falhou)');
      }
      
      this.logger.log('Cloudinary configurado com sucesso');
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Erro ao configurar Cloudinary: ${err.message}`, err.stack);
      // Não propagar erro - permite que o servidor inicie mesmo com Cloudinary com erro
    }
  }

  /**
   * Faz upload de uma imagem para o Cloudinary
   * 
   * Características:
   * - Converte para `webp` com `quality=auto:best` e `secure_url`.
   * - Aplica transformações por tipo: avatar (512x512, face crop) e blog (limit 1920px).
   * - Suporta `Buffer` ou `Express.Multer.File` (usa base64 data URI internamente).
   *
   * @param file Arquivo em `Buffer` ou `Express.Multer.File`.
   * @param folder Pasta de destino (default `avatars`).
   * @param publicId ID público opcional (pode incluir pasta).
   * @returns URL segura otimizada (`https`) da imagem enviada.
   * @throws BadRequestException quando Cloudinary não está configurado ou arquivo inválido.
  */
  async uploadImage(
    file: Buffer | any,
    folder: string = 'avatars',
    publicId?: string
  ): Promise<string> {
    const cloudinaryUrl = this.configService.get<string>('CLOUDINARY_URL');
    
    if (!cloudinaryUrl) {
      throw new BadRequestException('Cloudinary não configurado. Verifique CLOUDINARY_URL no .env');
    }

    try {
      // Converter para base64 se for Buffer ou Express.Multer.File
      let fileData: string;
      
      if (Buffer.isBuffer(file)) {
        fileData = `data:image/jpeg;base64,${file.toString('base64')}`;
      } else if ('buffer' in file && Buffer.isBuffer(file.buffer)) {
        const mimeType = file.mimetype || 'image/jpeg';
        fileData = `data:${mimeType};base64,${file.buffer.toString('base64')}`;
      } else {
        throw new BadRequestException('Formato de arquivo não suportado');
      }

      // Determinar transformações baseado na pasta
      const isAvatar = folder === 'avatars';
      
      // Upload com otimização WebP e máxima compressão
      // Usando 'auto:best' para melhor qualidade possível com compressão inteligente
      // Se publicId já contém a pasta (ex: blog/imagem_teste), não usar folder
      const publicIdWithFolder = publicId?.includes('/') ? publicId : publicId ? `${folder}/${publicId}` : undefined;
      
      const baseOptions = {
        ...(publicIdWithFolder ? { public_id: publicIdWithFolder } : { folder }),
        format: 'webp', // Força conversão para WebP
        quality: 'auto:best', // Qualidade automática otimizada - máxima compressão sem perder qualidade visual
        fetch_format: 'auto', // Formato automático baseado no navegador (fallback)
        resource_type: 'image' as const,
        overwrite: true, // Sobrescrever se já existir (útil para atualizações)
      };

      // Transformações específicas por tipo
      const uploadOptions = isAvatar
        ? {
            ...baseOptions,
            transformation: [
              {
                width: 512, // Tamanho máximo para avatar (512x512 é ideal para perfis)
                height: 512,
                crop: 'fill', // Preenche o espaço mantendo proporção
                gravity: 'face', // Foca no rosto se detectado (IA do Cloudinary)
                quality: 'auto:best',
                format: 'webp',
              },
            ],
          }
        : {
            ...baseOptions,
            // Para imagens do blog: otimizar para máxima compressão
            // Limitar largura a 1920px (Full HD) para economizar espaço no plano gratuito
            // Manter proporção automaticamente
            transformation: [
              {
                width: 1920, // Máximo Full HD (economiza muito espaço no plano gratuito)
                quality: 'auto:best', // Máxima compressão sem perder qualidade visual
                format: 'webp', // WebP otimizado (até 30% menor que JPEG/PNG)
                fetch_format: 'auto', // Fallback automático para navegadores antigos
                crop: 'limit', // Limita dimensões mas mantém proporção
              },
            ],
          };

      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          fileData,
          uploadOptions,
          (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
            if (error) {
              reject(error);
            } else if (!result) {
              reject(new Error('Upload falhou: resultado indefinido'));
            } else {
              resolve(result);
            }
          }
        );
      });

      // O Cloudinary já retorna a URL otimizada no result.secure_url
      // A transformação WebP já foi aplicada durante o upload
      // Usar a URL segura retornada
      const optimizedUrl = result.secure_url || result.url;
      
      if (!optimizedUrl) {
        throw new Error('Cloudinary não retornou URL da imagem');
      }

      this.logger.log(`Imagem enviada com sucesso: ${optimizedUrl}`);
      
      return optimizedUrl;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Erro ao fazer upload para Cloudinary: ${err.message}`, err.stack);
      throw new BadRequestException(`Erro ao fazer upload da imagem: ${err.message}`);
    }
  }

  /**
   * Deleta uma imagem do Cloudinary
   * 
   * @param publicId ID público da imagem no Cloudinary.
   * @returns `true` quando deletado com sucesso, `false` em falha.
  */
  async deleteImage(publicId: string): Promise<boolean> {
    try {
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Imagem deletada: ${publicId}`);
      return true;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Erro ao deletar imagem: ${err.message}`, err.stack);
      return false;
    }
  }

  /**
   * Extrai o public_id de uma URL do Cloudinary
   * 
   * @param url URL da imagem no Cloudinary.
   * @returns `public_id` (sem extensão) ou `null` se não for possível extrair.
  */
  extractPublicId(url: string): string | null {
    try {
      // Formato: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.webp
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
      if (match && match[1]) {
        return match[1].replace(/\.(webp|jpg|png|gif)$/i, '');
      }
      return null;
    } catch {
      return null;
    }
  }
}

