/**
 * Testes Unitários: Notifications Controller
 * 
 * Testa todos os endpoints do controller de notificações.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from '../../../src/modules/notifications/notifications.controller';
import { NotificationsService } from '../../../src/modules/notifications/notifications.service';
import { NotificationType, type Notification } from '../../../src/modules/notifications/notification.model';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: jest.Mocked<NotificationsService>;

  const mockNotification: Notification = {
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
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: {
            createNotification: jest.fn(),
            getNotificationById: jest.fn(),
            getNotificationsByUser: jest.fn(),
            countUnread: jest.fn(),
            updateNotification: jest.fn(),
            deleteNotification: jest.fn(),
            markAsRead: jest.fn(),
            markAllAsRead: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get(NotificationsService) as jest.Mocked<NotificationsService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Definição', () => {
    it('deve estar definido', () => {
      expect(controller).toBeDefined();
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

      service.createNotification.mockResolvedValue(mockNotification);

      const result = await controller.create(createData);

      expect(service.createNotification).toHaveBeenCalledWith(createData);
      expect(result).toEqual({
        success: true,
        data: mockNotification,
      });
    });
  });

  describe('findById', () => {
    it('deve buscar notificação por ID', async () => {
      service.getNotificationById.mockResolvedValue(mockNotification);

      const result = await controller.findById('notif-123');

      expect(service.getNotificationById).toHaveBeenCalledWith('notif-123');
      expect(result).toEqual({
        success: true,
        data: mockNotification,
      });
    });

    it('deve propagar NotFoundException', async () => {
      const error = new Error('Notificação não encontrada');
      service.getNotificationById.mockRejectedValue(error);

      await expect(controller.findById('invalid-id')).rejects.toThrow(error);
    });
  });

  describe('getByUser', () => {
    it('deve buscar notificações do usuário', async () => {
      const notifications = [mockNotification];
      service.getNotificationsByUser.mockResolvedValue(notifications);

      const result = await controller.getByUser('user-123');

      expect(service.getNotificationsByUser).toHaveBeenCalledWith('user-123', undefined);
      expect(result).toEqual({
        success: true,
        data: notifications,
      });
    });

    it('deve buscar apenas não lidas quando unreadOnly=true', async () => {
      const unreadNotifications = [{ ...mockNotification, isRead: false }];
      service.getNotificationsByUser.mockResolvedValue(unreadNotifications);

      const result = await controller.getByUser('user-123', true);

      expect(service.getNotificationsByUser).toHaveBeenCalledWith('user-123', true);
      expect(result).toEqual({
        success: true,
        data: unreadNotifications,
      });
    });

    it('deve retornar array vazio se não há notificações', async () => {
      service.getNotificationsByUser.mockResolvedValue([]);

      const result = await controller.getByUser('user-123');

      expect(result).toEqual({
        success: true,
        data: [],
      });
    });
  });

  describe('countUnread', () => {
    it('deve contar notificações não lidas', async () => {
      service.countUnread.mockResolvedValue({ count: 5 });

      const result = await controller.countUnread('user-123');

      expect(service.countUnread).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ count: 5 });
    });

    it('deve retornar 0 se não há não lidas', async () => {
      service.countUnread.mockResolvedValue({ count: 0 });

      const result = await controller.countUnread('user-123');

      expect(result).toEqual({ count: 0 });
    });
  });

  describe('update', () => {
    it('deve atualizar notificação com sucesso', async () => {
      const updateData = {
        isRead: true,
      };

      const updatedNotification: Notification = { ...mockNotification, isRead: true };
      service.updateNotification.mockResolvedValue(updatedNotification);

      const result = await controller.updateNotification('notif-123', updateData);

      expect(service.updateNotification).toHaveBeenCalledWith('notif-123', updateData);
      expect(result).toEqual({
        success: true,
        data: updatedNotification,
      });
    });

    it('deve propagar NotFoundException se notificação não existe', async () => {
      const error = new Error('Notificação não encontrada');
      service.updateNotification.mockRejectedValue(error);

      await expect(controller.updateNotification('invalid-id', {})).rejects.toThrow(error);
    });
  });

  describe('delete', () => {
    it('deve deletar notificação com sucesso', async () => {
      service.deleteNotification.mockResolvedValue({ success: true });

      const result = await controller.deleteNotification('notif-123');

      expect(service.deleteNotification).toHaveBeenCalledWith('notif-123');
      expect(result).toEqual({ success: true });
    });

    it('deve propagar NotFoundException se notificação não existe', async () => {
      const error = new Error('Notificação não encontrada');
      service.deleteNotification.mockRejectedValue(error);

      await expect(controller.deleteNotification('invalid-id')).rejects.toThrow(error);
    });
  });

  describe('markAsRead', () => {
    it('deve marcar notificação como lida', async () => {
      const readNotification: Notification = { ...mockNotification, isRead: true };
      service.markAsRead.mockResolvedValue(readNotification);

      const result = await controller.markAsRead('notif-123');

      expect(service.markAsRead).toHaveBeenCalledWith('notif-123');
      expect(result).toEqual({
        success: true,
        data: readNotification,
      });
    });
  });

  describe('markAllAsRead', () => {
    it('deve marcar todas as notificações como lidas', async () => {
      service.markAllAsRead.mockResolvedValue({ success: true, count: 5 });

      const result = await controller.markAllAsRead('user-123');

      expect(service.markAllAsRead).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ success: true, count: 5 });
    });

    it('deve retornar count 0 se não havia não lidas', async () => {
      service.markAllAsRead.mockResolvedValue({ success: true, count: 0 });

      const result = await controller.markAllAsRead('user-123');

      expect(result).toEqual({ success: true, count: 0 });
    });
  });
});
