/**
 * Testes Unitários: Cloudinary Controller
 * 
 * Testa todos os endpoints do controller de Cloudinary.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CloudinaryController } from '../../../src/modules/cloudinary/cloudinary.controller';
import { CloudinaryService } from '../../../src/modules/cloudinary/cloudinary.service';
import type { FastifyUploadedFile } from '../../../src/modules/users/interceptors/fastify-file.interceptor';

describe('CloudinaryController', () => {
  let controller: CloudinaryController;
  let service: jest.Mocked<CloudinaryService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CloudinaryController],
      providers: [
        {
          provide: CloudinaryService,
          useValue: {
            uploadImage: jest.fn(),
            deleteImage: jest.fn(),
            extractPublicId: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CloudinaryController>(CloudinaryController);
    service = module.get(CloudinaryService) as jest.Mocked<CloudinaryService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadBlogImage', () => {
    const mockFile: FastifyUploadedFile = {
      fieldname: 'image',
      filename: 'test-image.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake image data'),
      size: 1024,
    };

    const mockRequest = {
      file: mockFile,
      body: {},
    } as any;

    it('deve fazer upload de imagem do blog com sucesso', async () => {
      service.uploadImage.mockResolvedValue('https://res.cloudinary.com/test/image/upload/v123/blog/test-image.webp');
      
      const result = await controller.uploadBlogImage(mockRequest);
      
      expect(result).toEqual({
        success: true,
        url: '/blog/test-image',
        fullUrl: 'https://res.cloudinary.com/test/image/upload/v123/blog/test-image.webp',
      });
      
      expect(service.uploadImage).toHaveBeenCalledWith(
        expect.objectContaining({
          buffer: mockFile.buffer,
        }),
        'blog',
        expect.stringContaining('blog/')
      );
    });

    it('deve lançar erro quando nenhum arquivo é enviado', async () => {
      const requestWithoutFile = {
        file: undefined,
        body: {},
      } as any;
      
      await expect(controller.uploadBlogImage(requestWithoutFile)).rejects.toThrow(BadRequestException);
      await expect(controller.uploadBlogImage(requestWithoutFile)).rejects.toThrow('Nenhum arquivo enviado');
    });

    it('deve usar fileName do body quando fornecido', async () => {
      service.uploadImage.mockResolvedValue('https://res.cloudinary.com/test/image/upload/v123/blog/custom-name.webp');
      
      const requestWithFileName = {
        file: mockFile,
        body: [
          { fieldname: 'fileName', value: 'custom-name.jpg' },
        ],
      } as any;
      
      const result = await controller.uploadBlogImage(requestWithFileName);
      
      expect(result.url).toBe('/blog/custom-name');
      expect(service.uploadImage).toHaveBeenCalledWith(
        expect.any(Object),
        'blog',
        expect.stringContaining('blog/custom-name')
      );
    });

    it('deve sanitizar nome de arquivo removendo caracteres especiais', async () => {
      service.uploadImage.mockResolvedValue('https://res.cloudinary.com/test/image/upload/v123/blog/test-image.webp');
      
      const requestWithSpecialChars = {
        file: mockFile,
        body: [
          { fieldname: 'fileName', value: 'test@image#123.jpg' },
        ],
      } as any;
      
      await controller.uploadBlogImage(requestWithSpecialChars);
      
      expect(service.uploadImage).toHaveBeenCalledWith(
        expect.any(Object),
        'blog',
        expect.stringContaining('blog/test_image_123')
      );
    });

    it('deve converter para lowercase', async () => {
      service.uploadImage.mockResolvedValue('https://res.cloudinary.com/test/image/upload/v123/blog/test-image.webp');
      
      const requestWithUppercase = {
        file: mockFile,
        body: [
          { fieldname: 'fileName', value: 'TEST-IMAGE.jpg' },
        ],
      } as any;
      
      const result = await controller.uploadBlogImage(requestWithUppercase);
      
      expect(result.url).toBe('/blog/test-image');
    });

    it('deve remover extensão do nome de arquivo', async () => {
      service.uploadImage.mockResolvedValue('https://res.cloudinary.com/test/image/upload/v123/blog/test-image.webp');
      
      const requestWithExt = {
        file: mockFile,
        body: [
          { fieldname: 'fileName', value: 'test-image.jpg' },
        ],
      } as any;
      
      const result = await controller.uploadBlogImage(requestWithExt);
      
      expect(result.url).toBe('/blog/test-image');
      expect(result.url).not.toContain('.jpg');
    });

    it('deve usar filename como fallback quando fileName não está no body', async () => {
      service.uploadImage.mockResolvedValue('https://res.cloudinary.com/test/image/upload/v123/blog/test-image.webp');
      
      const result = await controller.uploadBlogImage(mockRequest);
      
      expect(result.url).toBe('/blog/test-image');
    });

    it('deve gerar timestamp quando nem fileName nem filename estão disponíveis', async () => {
      const fileWithoutName = {
        ...mockFile,
        filename: '',
      };
      
      const requestWithoutName = {
        file: fileWithoutName,
        body: {},
      } as any;
      
      service.uploadImage.mockResolvedValue('https://res.cloudinary.com/test/image/upload/v123/blog/generated.webp');
      
      const result = await controller.uploadBlogImage(requestWithoutName);
      
      expect(result.url).toMatch(/^\/blog\/imagem_\d+_/);
      expect(service.uploadImage).toHaveBeenCalled();
    });

    it('deve lançar erro quando upload falha', async () => {
      service.uploadImage.mockRejectedValue(new Error('Upload failed'));
      
      await expect(controller.uploadBlogImage(mockRequest)).rejects.toThrow(BadRequestException);
      await expect(controller.uploadBlogImage(mockRequest)).rejects.toThrow('Erro ao fazer upload');
    });

    it('deve processar body como objeto quando não é array', async () => {
      service.uploadImage.mockResolvedValue('https://res.cloudinary.com/test/image/upload/v123/blog/test.webp');
      
      const requestWithObjectBody = {
        file: mockFile,
        body: {
          fileName: 'test.jpg',
        },
      } as any;
      
      const result = await controller.uploadBlogImage(requestWithObjectBody);
      
      expect(result.url).toBe('/blog/test');
    });
  });

  describe('uploadAvatar', () => {
    const mockFile: FastifyUploadedFile = {
      fieldname: 'image',
      filename: 'avatar.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake image data'),
      size: 1024,
    };

    const mockRequest = {
      file: mockFile,
      body: {},
    } as any;

    it('deve fazer upload de avatar com sucesso', async () => {
      service.uploadImage.mockResolvedValue('https://res.cloudinary.com/test/image/upload/v123/avatars/avatar.webp');
      
      const result = await controller.uploadAvatar(mockRequest);
      
      expect(result).toEqual({
        success: true,
        url: 'https://res.cloudinary.com/test/image/upload/v123/avatars/avatar.webp',
      });
      
      expect(service.uploadImage).toHaveBeenCalledWith(
        expect.objectContaining({
          buffer: mockFile.buffer,
        }),
        'avatars',
        expect.stringMatching(/^avatars\/\d+-\w+$/)
      );
    });

    it('deve lançar erro quando nenhum arquivo é enviado', async () => {
      const requestWithoutFile = {
        file: undefined,
        body: {},
      } as any;
      
      await expect(controller.uploadAvatar(requestWithoutFile)).rejects.toThrow(BadRequestException);
      await expect(controller.uploadAvatar(requestWithoutFile)).rejects.toThrow('Nenhum arquivo enviado');
    });

    it('deve gerar public_id único baseado em timestamp e random', async () => {
      service.uploadImage.mockResolvedValue('https://res.cloudinary.com/test/image/upload/v123/avatars/avatar.webp');
      
      await controller.uploadAvatar(mockRequest);
      
      const uploadCall = service.uploadImage.mock.calls[0];
      const publicId = uploadCall[2] as string;
      
      expect(publicId).toMatch(/^avatars\/\d+-\w+$/);
    });

    it('deve converter FastifyUploadedFile para formato compatível', async () => {
      service.uploadImage.mockResolvedValue('https://res.cloudinary.com/test/image/upload/v123/avatars/avatar.webp');
      
      await controller.uploadAvatar(mockRequest);
      
      const uploadCall = service.uploadImage.mock.calls[0];
      const expressFile = uploadCall[0];
      
      expect(expressFile).toHaveProperty('fieldname', 'image');
      expect(expressFile).toHaveProperty('originalname', 'avatar.jpg');
      expect(expressFile).toHaveProperty('mimetype', 'image/jpeg');
      expect(expressFile).toHaveProperty('buffer');
      expect(expressFile).toHaveProperty('size', 1024);
    });

    it('deve lançar erro quando upload falha', async () => {
      service.uploadImage.mockRejectedValue(new Error('Upload failed'));
      
      await expect(controller.uploadAvatar(mockRequest)).rejects.toThrow(BadRequestException);
      await expect(controller.uploadAvatar(mockRequest)).rejects.toThrow('Erro ao fazer upload');
    });
  });
});
