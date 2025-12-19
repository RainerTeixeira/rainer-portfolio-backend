import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cloudinary from 'cloudinary';
import { CloudinaryService } from './cloudinary.service';

// Mocks do Cloudinary - definidos dentro do factory e expostos em __mocks
jest.mock('cloudinary', () => {
  const upload = jest.fn();
  const destroy = jest.fn();
  const config = jest.fn();

  return {
    v2: {
      uploader: {
        upload,
        destroy,
      },
      config,
    },
    __mocks: { upload, destroy, config },
  };
});

const cloudinaryLib = cloudinary as unknown as {
  __mocks: {
    upload: jest.Mock<
      void,
      [string, Record<string, unknown>, (error: unknown, result?: { secure_url?: string; public_id?: string }) => void]
    >;
    destroy: jest.Mock;
    config: jest.Mock;
  };
};
const uploadMock = cloudinaryLib.__mocks.upload;
const destroyMock = cloudinaryLib.__mocks.destroy;

const createService = (cloudinaryUrl?: string) => {
  const configService: Partial<ConfigService> = {
    get: jest.fn().mockReturnValue(cloudinaryUrl),
  };
  return { service: new CloudinaryService(configService as ConfigService), configService };
};

describe('CloudinaryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (uploadMock as jest.Mock).mockReset();
    (destroyMock as jest.Mock).mockReset();
  });

  it('deve fazer upload de buffer com sucesso', async () => {
    const { service } = createService('cloudinary://key:secret@demo');

    uploadMock.mockImplementation((
      _fileData: string,
      _options: Record<string, unknown>,
      cb: (error: unknown, result?: { secure_url?: string; public_id?: string }) => void,
    ) => {
      cb(undefined, {
        secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/blog/file.webp',
        public_id: 'blog/file',
      });
    });

    const result = await service.uploadImage(Buffer.from('file'), 'blog', 'blog/file');

    expect(uploadMock).toHaveBeenCalled();
    expect(result).toContain('https://res.cloudinary.com/demo');
  });

  it('deve lançar erro se CLOUDINARY_URL não estiver configurada', async () => {
    const { service } = createService(undefined);

    await expect(service.uploadImage(Buffer.from('file'))).rejects.toThrow(BadRequestException);
  });

  it('deve deletar imagem e retornar true em sucesso', async () => {
    const { service } = createService('cloudinary://key:secret@demo');
    destroyMock.mockResolvedValue({ result: 'ok' });

    const ok = await service.deleteImage('v123/blog/file');

    expect(destroyMock).toHaveBeenCalledWith('blog/file');
    expect(ok).toBe(true);
  });

  it('deve retornar false se falhar ao deletar', async () => {
    const { service } = createService('cloudinary://key:secret@demo');
    destroyMock.mockRejectedValue(new Error('fail'));

    const ok = await service.deleteImage('blog/file');

    expect(ok).toBe(false);
  });

  it('extractPublicId deve extrair id com versão', () => {
    const { service } = createService('cloudinary://key:secret@demo');
    const url = 'https://res.cloudinary.com/demo/image/upload/v123/blog/file.webp';

    expect(service.extractPublicId(url)).toBe('v123/blog/file');
  });

  it('extractShortId deve extrair último segmento', () => {
    const { service } = createService('cloudinary://key:secret@demo');
    const url = 'https://res.cloudinary.com/demo/image/upload/v123/blog/file.webp';

    expect(service.extractShortId(url)).toBe('file');
  });

  it('getPublicUrlFromId deve montar URL quando base for configurada', () => {
    const { service } = createService('cloudinary://key:secret@demo');
    // Inicializa base URL via construtor
    (service as any).cloudinaryBaseUrl = 'https://res.cloudinary.com/demo/image/upload';

    const url = service.getPublicUrlFromId('user1');

    expect(url).toBe('https://res.cloudinary.com/demo/image/upload/avatars/user1.webp');
  });
});
