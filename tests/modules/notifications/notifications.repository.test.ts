/**
 * Testes Unitários: Notifications Repository
 * 
 * Testa todas as operações do repositório de notificações.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsRepository } from '../../../src/modules/notifications/notifications.repository';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { NotificationType } from '../../../src/modules/notifications/notification.model';

describe('NotificationsRepository', () => {
  let repository: NotificationsRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockNotification = {
    id: 'notif-123',
    userId: 'user-123',
    type: NotificationType.NEW_LIKE,
    title: 'Nova curtida',
    message: 'Alguém curtiu seu post',
    link: '/posts/post-123',
    isRead: false,
    createdAt: new Date(),
    readAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsRepository,
        {
          provide: PrismaService,
          useValue: {
            notification: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<NotificationsRepository>(NotificationsRepository);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Definição', () => {
    it('deve estar definido', () => {
      expect(repository).toBeDefined();
    });
  });

  describe('create', () => {
    it('deve criar notificação com sucesso', async () => {
      const createData = {
        userId: 'user-123',
        type: NotificationType.NEW_LIKE,
        title: 'Nova curtida',
        message: 'Alguém curtiu seu post',
      };

      (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);

      const result = await repository.create(createData);

      expect(prisma.notification.create).toHaveBeenCalledWith({ data: createData });
      expect(result).toEqual(mockNotification);
    });
  });

  describe('findById', () => {
    it('deve encontrar notificação por ID', async () => {
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotification);

      const result = await repository.findById('notif-123');

      expect(prisma.notification.findUnique).toHaveBeenCalledWith({
        where: { id: 'notif-123' },
      });
      expect(result).toEqual(mockNotification);
    });

    it('deve retornar null se notificação não existe', async () => {
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('findByUser', () => {
    it('deve buscar todas as notificações do usuário', async () => {
      const notifications = [mockNotification];
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(notifications);

      const result = await repository.findByUser('user-123');

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(notifications);
    });

    it('deve buscar apenas não lidas quando unreadOnly=true', async () => {
      const unreadNotifications = [{ ...mockNotification, isRead: false }];
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(unreadNotifications);

      const result = await repository.findByUser('user-123', { unreadOnly: true });

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', isRead: false },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(unreadNotifications);
    });

    it('deve retornar array vazio se não há notificações', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);

      const result = await repository.findByUser('user-123');

      expect(result).toEqual([]);
    });

    it('deve ordenar por createdAt desc', async () => {
      await repository.findByUser('user-123');

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('update', () => {
    it('deve atualizar notificação com sucesso', async () => {
      const updateData = {
        isRead: true,
      };

      const updatedNotification = { ...mockNotification, isRead: true };
      (prisma.notification.update as jest.Mock).mockResolvedValue(updatedNotification);

      const result = await repository.update('notif-123', updateData);

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-123' },
        data: updateData,
      });
      expect(result).toEqual(updatedNotification);
    });
  });

  describe('delete', () => {
    it('deve deletar notificação com sucesso', async () => {
      (prisma.notification.delete as jest.Mock).mockResolvedValue(mockNotification);

      const result = await repository.delete('notif-123');

      expect(prisma.notification.delete).toHaveBeenCalledWith({
        where: { id: 'notif-123' },
      });
      expect(result).toBe(true);
    });

    it('deve retornar true mesmo se Prisma retornar void', async () => {
      (prisma.notification.delete as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.delete('notif-123');

      expect(result).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('deve marcar todas as notificações como lidas', async () => {
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 5 });

      const result = await repository.markAllAsRead('user-123');

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', isRead: false },
        data: { isRead: true },
      });
      expect(result).toBe(5);
    });

    it('deve retornar 0 se não havia não lidas', async () => {
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const result = await repository.markAllAsRead('user-123');

      expect(result).toBe(0);
    });

    it('deve atualizar apenas as não lidas', async () => {
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      await repository.markAllAsRead('user-123');

      expect(prisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isRead: false,
          }),
        })
      );
    });
  });

  describe('countUnread', () => {
    it('deve contar notificações não lidas', async () => {
      (prisma.notification.count as jest.Mock).mockResolvedValue(5);

      const result = await repository.countUnread('user-123');

      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-123', isRead: false },
      });
      expect(result).toBe(5);
    });

    it('deve retornar 0 se não há não lidas', async () => {
      (prisma.notification.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.countUnread('user-123');

      expect(result).toBe(0);
    });

    it('deve contar apenas as não lidas', async () => {
      await repository.countUnread('user-123');

      expect(prisma.notification.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isRead: false,
          }),
        })
      );
    });
  });
});
