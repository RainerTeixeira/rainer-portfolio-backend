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
  /**
   * Base pública do Cloudinary para geração de URLs a partir de IDs curtos.
   * Ex: https://res.cloudinary.com/<cloud_name>/image/upload
   */
  private cloudinaryBaseUrl: string | null = null;

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
        const normalizedCloudName = cloudName.trim();
        this.cloudinaryBaseUrl = `https://res.cloudinary.com/${normalizedCloudName}/image/upload`;
        this.logger.log(`Cloudinary configurado: cloud_name=${normalizedCloudName}`);
      } else {
        // Fallback: tentar usar a URL diretamente via variável de ambiente
        process.env.CLOUDINARY_URL = cloudinaryUrl;
        cloudinary.config({
          secure: true,
        });
        this.logger.warn('Cloudinary configurado via CLOUDINARY_URL (parse manual falhou)');
      }
      
      if (!this.cloudinaryBaseUrl) {
        // Como fallback, tentar inferir cloud_name da própria URL do Cloudinary
        const cloudNameMatch = cloudinaryUrl.match(/@([^/]+)/);
        if (cloudNameMatch && cloudNameMatch[1]) {
          const normalizedCloudName = cloudNameMatch[1].trim();
          this.cloudinaryBaseUrl = `https://res.cloudinary.com/${normalizedCloudName}/image/upload`;
        }
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
   * @param file Arquivo em `Buffer` ou `Express.Multer.File`.
   * @param folder Pasta de destino (ex: 'avatars', 'blog').
   * @param publicId ID público (será salvo como folder/publicId).
   * @returns URL segura completa da imagem.
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
      // Converter para base64
      let fileData: string;
      
      if (Buffer.isBuffer(file)) {
        fileData = `data:image/jpeg;base64,${file.toString('base64')}`;
      } else if ('buffer' in file && Buffer.isBuffer(file.buffer)) {
        const mimeType = file.mimetype || 'image/jpeg';
        fileData = `data:${mimeType};base64,${file.buffer.toString('base64')}`;
      } else {
        throw new BadRequestException('Formato de arquivo não suportado');
      }

      const isAvatar = folder === 'avatars';
      
      // Opções de upload - SIMPLES e FUNCIONAL
      const uploadOptions: any = {
        folder: folder, // Pasta no Cloudinary (avatars, blog, etc)
        public_id: publicId, // ID dentro da pasta (sem a pasta no nome)
        format: 'webp',
        resource_type: 'image',
        overwrite: true,
        invalidate: true, // Invalida cache do CDN
      };

      // Transformações para avatar
      if (isAvatar) {
        uploadOptions.transformation = [
          {
            width: 512,
            height: 512,
            crop: 'fill',
            gravity: 'face',
            quality: 'auto:good',
            format: 'webp',
          },
        ];
      } else {
        // Blog images
        uploadOptions.transformation = [
          {
            width: 1920,
            crop: 'limit',
            quality: 'auto:good',
            format: 'webp',
          },
        ];
      }

      this.logger.log(`Uploading to Cloudinary: folder=${folder}, publicId=${publicId}`);

      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          fileData,
          uploadOptions,
          (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
            if (error) {
              this.logger.error(`Cloudinary error: ${JSON.stringify(error)}`);
              reject(error);
            } else if (!result) {
              reject(new Error('Upload falhou: resultado indefinido'));
            } else {
              resolve(result);
            }
          }
        );
      });

      const finalUrl = result.secure_url;
      
      if (!finalUrl) {
        throw new Error('Cloudinary não retornou URL da imagem');
      }

      this.logger.log(`✅ Upload OK: ${finalUrl} (public_id: ${result.public_id})`);
      
      return finalUrl;
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
      // Se o publicId vier com versão (ex: "v1234567890/avatars/cognitoSub"),
      // remover o prefixo de versão antes de chamar o destroy
      const normalizedPublicId = publicId.replace(/^v\d+\//, '');

      await cloudinary.uploader.destroy(normalizedPublicId);
      this.logger.log(`Imagem deletada: ${normalizedPublicId}`);
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
      // Queremos extrair incluindo a versão, ex: "v1234567890/folder/public_id"
      const withVersionMatch = url.match(/\/upload\/(v\d+\/.+?)(?:\.[^.]+)?$/);
      
      if (withVersionMatch && withVersionMatch[1]) {
        return withVersionMatch[1].replace(/\.(webp|jpg|png|gif)$/i, '');
      }

      // Fallback: se por algum motivo não houver versão na URL, extrair apenas o caminho
      const withoutVersionMatch = url.match(/\/upload\/(.+?)(?:\.[^.]+)?$/);
      
      if (withoutVersionMatch && withoutVersionMatch[1]) {
        return withoutVersionMatch[1].replace(/\.(webp|jpg|png|gif)$/i, '');
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Extrai apenas o ID curto (último segmento) de uma URL do Cloudinary.
   * Exemplo:
   *   https://res.cloudinary.com/xxx/image/upload/v123/avatars/aaaa_bbbb.webp
   *   → "aaaa_bbbb"
   */
  extractShortId(url: string): string | null {
    try {
      const match = url.match(/\/([^\/]+?)(?:\.[^.\/]+)?$/);
      return match && match[1] ? match[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Monta URL pública do avatar a partir do cognitoSub.
   * Retorna null se cloudinaryBaseUrl não estiver configurado.
   */
  getPublicUrlFromId(cognitoSub: string | null | undefined): string | null {
    if (!cognitoSub) {
      return null;
    }

    // Se já for URL absoluta, retorna como está
    if (cognitoSub.startsWith('http://') || cognitoSub.startsWith('https://')) {
      return cognitoSub;
    }

    if (!this.cloudinaryBaseUrl) {
      this.logger.warn('cloudinaryBaseUrl não configurado - não é possível montar URL do avatar');
      return null;
    }

    // URL do avatar: baseUrl/avatars/cognitoSub.webp
    return `${this.cloudinaryBaseUrl}/avatars/${cognitoSub}.webp`;
  }
}

