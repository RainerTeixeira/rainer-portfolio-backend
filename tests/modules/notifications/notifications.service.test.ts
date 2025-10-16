/**
 * Testes Unitários: Notifications Service
 * 
 * Testa a lógica de negócio de notificações.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../../../src/modules/notifications/notifications.service';
import { NotificationsRepository } from '../../../src/modules/notifications/notifications.repository';
import { NotificationType } from '../../../src/modules/notifications/notification.model';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: jest.Mocked<NotificationsRepository>;

  const mockNotification = {
    id: 'notif-123',
    userId: 'user-123',
    type: NotificationType.NEW_COMMENT,
    title: 'Novo comentário',
    message: 'Alguém comentou no seu post',
    isRead: false,
    createdAt: new Date(),
    readAt: null,
  };

  const mockNotifications = [mockNotification];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NotificationsRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByUser: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            markAllAsRead: jest.fn(),
            countUnread: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repository = module.get(NotificationsRepository) as jest.Mocked<NotificationsRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('deve criar notificação com sucesso', async () => {
      const notificationData = {
        userId: 'user-123',
        type: NotificationType.NEW_COMMENT,
        title: 'Novo comentário',
        message: 'Alguém comentou no seu post',
      };

      repository.create.mockResolvedValue(mockNotification);

      const result = await service.createNotification(notificationData);

      expect(repository.create).toHaveBeenCalledWith(notificationData);
      expect(result).toEqual(mockNotification);
    });
  });

  describe('getNotificationsByUser', () => {
    it('deve buscar notificações do usuário', async () => {
      repository.findByUser.mockResolvedValue(mockNotifications);

      const result = await service.getNotificationsByUser('user-123');

      expect(repository.findByUser).toHaveBeenCalledWith('user-123', { unreadOnly: false });
      expect(result).toEqual(mockNotifications);
    });

    it('deve buscar apenas não lidas', async () => {
      repository.findByUser.mockResolvedValue(mockNotifications);

      const result = await service.getNotificationsByUser('user-123', true);

      expect(repository.findByUser).toHaveBeenCalledWith('user-123', { unreadOnly: true });
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('markAsRead', () => {
    it('deve marcar notificação como lida', async () => {
      const readNotification = { ...mockNotification, isRead: true };
      
      repository.findById.mockResolvedValue(mockNotification);
      repository.update.mockResolvedValue(readNotification);

      const result = await service.markAsRead('notif-123');

      expect(repository.update).toHaveBeenCalledWith('notif-123', { isRead: true });
      expect(result).toEqual(readNotification);
    });
  });

  describe('getNotificationById', () => {
    it('deve buscar notificação por ID', async () => {
      repository.findById.mockResolvedValue(mockNotification);

      const result = await service.getNotificationById('notif-123');

      expect(repository.findById).toHaveBeenCalledWith('notif-123');
      expect(result).toEqual(mockNotification);
    });

    it('deve lançar NotFoundException quando notificação não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getNotificationById('invalid-id')).rejects.toThrow('Notificação não encontrada');
    });
  });

  describe('updateNotification', () => {
    it('deve atualizar notificação', async () => {
      const updateData = { title: 'Título Atualizado' };
      const updatedNotification = { ...mockNotification, ...updateData };

      repository.findById.mockResolvedValue(mockNotification);
      repository.update.mockResolvedValue(updatedNotification);

      const result = await service.updateNotification('notif-123', updateData);

      expect(repository.update).toHaveBeenCalledWith('notif-123', updateData);
      expect(result.title).toBe('Título Atualizado');
    });

    it('deve lançar NotFoundException ao atualizar notificação inexistente', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.updateNotification('invalid-id', {})
      ).rejects.toThrow('Notificação não encontrada');
    });
  });

  describe('deleteNotification', () => {
    it('deve deletar notificação', async () => {
      repository.findById.mockResolvedValue(mockNotification);
      repository.delete.mockResolvedValue(true);

      const result = await service.deleteNotification('notif-123');

      expect(repository.delete).toHaveBeenCalledWith('notif-123');
      expect(result.success).toBe(true);
    });

    it('deve lançar NotFoundException ao deletar notificação inexistente', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.deleteNotification('invalid-id')
      ).rejects.toThrow('Notificação não encontrada');
    });
  });

  describe('countUnread', () => {
    it('deve contar notificações não lidas', async () => {
      repository.countUnread.mockResolvedValue(3);

      const result = await service.countUnread('user-123');

      expect(repository.countUnread).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ count: 3 });
    });

    it('deve retornar zero quando não há não lidas', async () => {
      repository.countUnread.mockResolvedValue(0);

      const result = await service.countUnread('user-123');

      expect(result.count).toBe(0);
    });
  });

  describe('markAllAsRead', () => {
    it('deve marcar todas como lidas', async () => {
      repository.findById.mockResolvedValue(mockNotification);
      repository.markAllAsRead.mockResolvedValue(5);

      const result = await service.markAllAsRead('user-123');

      expect(repository.markAllAsRead).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ success: true, count: 5 });
    });
  });
});
