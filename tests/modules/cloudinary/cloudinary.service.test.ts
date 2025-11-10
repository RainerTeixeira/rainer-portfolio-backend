/**
 * Testes Unitários: Cloudinary Service
 * 
 * Testa o serviço de upload e gerenciamento de imagens no Cloudinary.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { CloudinaryService } from '../../../src/modules/cloudinary/cloudinary.service';
import { v2 as cloudinary } from 'cloudinary';

// Mock do Cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn((_fileData, _options, callback) => {
        // Simular sucesso
        callback(null, {
          secure_url: 'https://res.cloudinary.com/test/image/upload/v123/test.webp',
          url: 'https://res.cloudinary.com/test/image/upload/v123/test.webp',
          public_id: 'test',
        });
      }),
      destroy: jest.fn((_publicId, callback?) => {
        if (callback && typeof callback === 'function') {
          callback(null, { result: 'ok' });
        }
        return Promise.resolve({ result: 'ok' });
      }),
    },
  },
}));

describe('CloudinaryService', () => {
  let service: CloudinaryService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Construtor', () => {
    it('deve estar definido', () => {
      expect(service).toBeDefined();
    });

    it('deve configurar Cloudinary quando CLOUDINARY_URL está presente', () => {
      configService.get.mockReturnValue('cloudinary://api_key:api_secret@cloud_name');
      
      // Teste de inicialização
      new CloudinaryService(configService);
      
      expect(cloudinary.config).toHaveBeenCalled();
    });

    it('deve logar warning quando CLOUDINARY_URL não está presente', () => {
      configService.get.mockReturnValue(undefined);
      // O CloudinaryService usa Logger do NestJS, não console.warn
      const loggerSpy = jest.spyOn(require('@nestjs/common').Logger.prototype, 'warn').mockImplementation();
      
      new CloudinaryService(configService);
      
      expect(loggerSpy).toHaveBeenCalled();
      loggerSpy.mockRestore();
    });

    it('deve fazer parse correto da URL do Cloudinary', () => {
      configService.get.mockReturnValue('cloudinary://934767314247937:secret@dkt0xccga');
      
      new CloudinaryService(configService);
      
      expect(cloudinary.config).toHaveBeenCalledWith({
        cloud_name: 'dkt0xccga',
        api_key: '934767314247937',
        api_secret: 'secret',
        secure: true,
      });
    });
  });

  describe('uploadImage', () => {
    beforeEach(() => {
      configService.get.mockReturnValue('cloudinary://api_key:api_secret@cloud_name');
    });

    it('deve lançar erro quando Cloudinary não está configurado', async () => {
      configService.get.mockReturnValue(undefined);
      
      const buffer = Buffer.from('fake image data');
      
      await expect(service.uploadImage(buffer)).rejects.toThrow(BadRequestException);
      await expect(service.uploadImage(buffer)).rejects.toThrow('Cloudinary não configurado');
    });

    it('deve fazer upload de Buffer com sucesso', async () => {
      const buffer = Buffer.from('fake image data');
      
      const result = await service.uploadImage(buffer, 'avatars');
      
      expect(result).toBe('https://res.cloudinary.com/test/image/upload/v123/test.webp');
      expect(cloudinary.uploader.upload).toHaveBeenCalled();
    });

    it('deve fazer upload de Express.Multer.File com sucesso', async () => {
    const mockFile = {
      fieldname: 'image',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
        buffer: Buffer.from('fake image data'),
      destination: '',
      filename: 'test.jpg',
      path: '',
      stream: null as never,
    };

      const result = await service.uploadImage(mockFile, 'blog');
      
      expect(result).toBe('https://res.cloudinary.com/test/image/upload/v123/test.webp');
      expect(cloudinary.uploader.upload).toHaveBeenCalled();
    });

    it('deve aplicar transformações de avatar (512x512)', async () => {
      const buffer = Buffer.from('fake image data');
      
      await service.uploadImage(buffer, 'avatars');
      
      const uploadCall = (cloudinary.uploader.upload as jest.Mock).mock.calls[0];
      const options = uploadCall[1];
      
      expect(options.folder).toBe('avatars');
      expect(options.transformation).toBeDefined();
      expect(options.transformation[0].width).toBe(512);
      expect(options.transformation[0].height).toBe(512);
      expect(options.transformation[0].crop).toBe('fill');
      expect(options.transformation[0].gravity).toBe('face');
    });

    it('deve aplicar transformações de blog (1920px max)', async () => {
      const buffer = Buffer.from('fake image data');
      
      await service.uploadImage(buffer, 'blog');
      
      const uploadCall = (cloudinary.uploader.upload as jest.Mock).mock.calls[0];
      const options = uploadCall[1];
      
      expect(options.folder).toBe('blog');
      expect(options.transformation).toBeDefined();
      expect(options.transformation[0].width).toBe(1920);
      expect(options.transformation[0].crop).toBe('limit');
    });

    it('deve usar publicId quando fornecido', async () => {
      const buffer = Buffer.from('fake image data');
      
      await service.uploadImage(buffer, 'blog', 'blog/custom-id');
      
      const uploadCall = (cloudinary.uploader.upload as jest.Mock).mock.calls[0];
      const options = uploadCall[1];
      
      expect(options.public_id).toBe('blog/custom-id');
    });

    it('deve combinar folder e publicId quando publicId não contém pasta', async () => {
      const buffer = Buffer.from('fake image data');
      
      await service.uploadImage(buffer, 'blog', 'custom-id');
      
      const uploadCall = (cloudinary.uploader.upload as jest.Mock).mock.calls[0];
      const options = uploadCall[1];
      
      expect(options.public_id).toBe('blog/custom-id');
    });

    it('deve lançar erro quando formato de arquivo não é suportado', async () => {
      const invalidFile = { invalid: true } as any;
      
      await expect(service.uploadImage(invalidFile)).rejects.toThrow(BadRequestException);
      await expect(service.uploadImage(invalidFile)).rejects.toThrow('Formato de arquivo não suportado');
    });

    it('deve lançar erro quando upload falha', async () => {
      (cloudinary.uploader.upload as jest.Mock).mockImplementation((_fileData, _options, callback) => {
        callback(new Error('Upload failed'), undefined);
      });
      
      const buffer = Buffer.from('fake image data');
      
      await expect(service.uploadImage(buffer)).rejects.toThrow(BadRequestException);
      await expect(service.uploadImage(buffer)).rejects.toThrow('Erro ao fazer upload da imagem');
    });

    it('deve lançar erro quando resultado é indefinido', async () => {
      (cloudinary.uploader.upload as jest.Mock).mockImplementation((_fileData, _options, callback) => {
        callback(null, undefined);
      });
      
      const buffer = Buffer.from('fake image data');
      
      await expect(service.uploadImage(buffer)).rejects.toThrow(BadRequestException);
    });

    it('deve usar secure_url quando disponível', async () => {
      (cloudinary.uploader.upload as jest.Mock).mockImplementation((_fileData, _options, callback) => {
        callback(null, {
          secure_url: 'https://secure-url.com/image.webp',
          url: 'http://non-secure-url.com/image.webp',
        });
      });
      
      const buffer = Buffer.from('fake image data');
      const result = await service.uploadImage(buffer);
      
      expect(result).toBe('https://secure-url.com/image.webp');
    });

    it('deve usar url como fallback quando secure_url não está disponível', async () => {
      (cloudinary.uploader.upload as jest.Mock).mockImplementation((_fileData, _options, callback) => {
        callback(null, {
          url: 'http://fallback-url.com/image.webp',
        });
      });
      
      const buffer = Buffer.from('fake image data');
      const result = await service.uploadImage(buffer);
      
      expect(result).toBe('http://fallback-url.com/image.webp');
    });
  });

  describe('deleteImage', () => {
    it('deve deletar imagem com sucesso', async () => {
      // O método destroy agora usa Promise, não callback
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });
      
      const result = await service.deleteImage('test-public-id');
      
      expect(result).toBe(true);
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('test-public-id');
    });

    it('deve retornar false quando deletar falha', async () => {
      // O método destroy agora usa Promise
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      const result = await service.deleteImage('test-public-id');

      expect(result).toBe(false);
    });
  });

  describe('extractPublicId', () => {
    it('deve extrair public_id de URL válida', () => {
      const url = 'https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.webp';
      const result = service.extractPublicId(url);
      
      expect(result).toBe('folder/public_id');
    });

    it('deve extrair public_id sem versão', () => {
      const url = 'https://res.cloudinary.com/cloud_name/image/upload/folder/public_id.webp';
      const result = service.extractPublicId(url);
      
      expect(result).toBe('folder/public_id');
    });

    it('deve retornar null para URL inválida', () => {
      const url = 'https://invalid-url.com/image.jpg';
      const result = service.extractPublicId(url);
      
      expect(result).toBeNull();
    });

    it('deve retornar null para string vazia', () => {
      const result = service.extractPublicId('');
      
      expect(result).toBeNull();
    });

    it('deve remover extensão do public_id', () => {
      const url = 'https://res.cloudinary.com/cloud_name/image/upload/v123/test.jpg';
      const result = service.extractPublicId(url);
      
      expect(result).toBe('test');
    });
  });
});
