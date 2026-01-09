import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { NOTIFICATION_REPOSITORY } from '../../../database/tokens';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockNotificationRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUser: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    delete: jest.fn(),
    deleteAll: jest.fn(),
    getUnreadCount: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NOTIFICATION_REPOSITORY,
          useValue: mockNotificationRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create a new notification', async () => {
      const dto = {
        userId: 'user-1',
        title: 'New Like',
        message: 'Someone liked your post',
        type: 'INFO' as const,
        isRead: false,
        relatedId: 'post-1',
        relatedType: 'POST' as const,
        actionUrl: '/posts/post-1',
      };

      const createdNotification = {
        id: 'notification-1',
        ...dto,
      };

      mockNotificationRepository.create.mockResolvedValue(createdNotification);

      const result = await service.createNotification(dto);

      expect(result).toEqual(createdNotification);
      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          title: 'New Like',
          message: 'Someone liked your post',
          type: 'INFO',
          isRead: false,
          relatedId: 'post-1',
          relatedType: 'POST',
          actionUrl: '/posts/post-1',
        })
      );
    });

    it('should create notification with default isRead false', async () => {
      const dto = {
        userId: 'user-1',
        title: 'New Like',
        message: 'Someone liked your post',
        type: 'INFO' as const,
      };

      const createdNotification = {
        id: 'notification-1',
        userId: 'user-1',
        title: 'New Like',
        message: 'Someone liked your post',
        type: 'INFO',
        isRead: false,
      };

      mockNotificationRepository.create.mockResolvedValue(createdNotification);

      const result = await service.createNotification(dto);

      expect(result).toEqual(createdNotification);
      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isRead: false,
        })
      );
    });
  });

  describe('getNotificationById', () => {
    it('should return notification by id', async () => {
      const notification = {
        id: 'notification-1',
        userId: 'user-1',
        title: 'New Like',
      };

      mockNotificationRepository.findById.mockResolvedValue(notification);

      const result = await service.getNotificationById('notification-1');

      expect(result).toEqual(notification);
      expect(mockNotificationRepository.findById).toHaveBeenCalledWith('notification-1');
    });

    it('should return null when notification not found', async () => {
      mockNotificationRepository.findById.mockResolvedValue(null);

      const result = await service.getNotificationById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserNotifications', () => {
    it('should return user notifications with options', async () => {
      const notifications = [
        { id: '1', userId: 'user-1', title: 'Notification 1' },
        { id: '2', userId: 'user-1', title: 'Notification 2' },
      ];

      const options = {
        limit: 10,
        offset: 0,
        unreadOnly: false,
      };

      mockNotificationRepository.findByUser.mockResolvedValue(notifications);

      const result = await service.getUserNotifications('user-1', options);

      expect(result).toEqual(notifications);
      expect(mockNotificationRepository.findByUser).toHaveBeenCalledWith('user-1', options);
    });

    it('should return user notifications without options', async () => {
      const notifications = [
        { id: '1', userId: 'user-1', title: 'Notification 1' },
      ];

      mockNotificationRepository.findByUser.mockResolvedValue(notifications);

      const result = await service.getUserNotifications('user-1');

      expect(result).toEqual(notifications);
      expect(mockNotificationRepository.findByUser).toHaveBeenCalledWith('user-1', undefined);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      await service.markAsRead('notification-1');

      expect(mockNotificationRepository.markAsRead).toHaveBeenCalledWith('notification-1');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      await service.markAllAsRead('user-1');

      expect(mockNotificationRepository.markAllAsRead).toHaveBeenCalledWith('user-1');
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      await service.deleteNotification('notification-1');

      expect(mockNotificationRepository.delete).toHaveBeenCalledWith('notification-1');
    });
  });

  describe('deleteAllNotifications', () => {
    it('should delete all user notifications', async () => {
      await service.deleteAllNotifications('user-1');

      expect(mockNotificationRepository.deleteAll).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count for user', async () => {
      mockNotificationRepository.getUnreadCount.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(5);
      expect(mockNotificationRepository.getUnreadCount).toHaveBeenCalledWith('user-1');
    });
  });

  describe('notifyNewLike', () => {
    it('should create notification for new like', async () => {
      const createdNotification = {
        id: 'notification-1',
        userId: 'user-1',
        title: 'Novo like',
        message: 'John curtiu seu post',
        type: 'INFO',
        relatedId: 'post-1',
        relatedType: 'POST',
        actionUrl: '/posts/post-1',
      };

      mockNotificationRepository.create.mockResolvedValue(createdNotification);

      const result = await service.notifyNewLike('user-1', 'post-1', 'John');

      expect(result).toEqual(createdNotification);
      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          title: 'Novo like',
          message: 'John curtiu seu post',
          type: 'INFO',
          relatedId: 'post-1',
          relatedType: 'POST',
          actionUrl: '/posts/post-1',
          isRead: false,
        })
      );
    });
  });

  describe('notifyNewComment', () => {
    it('should create notification for new comment', async () => {
      const createdNotification = {
        id: 'notification-1',
        userId: 'user-1',
        title: 'Novo comentário',
        message: 'John comentou no seu post',
        type: 'INFO',
        relatedId: 'post-1',
        relatedType: 'POST',
        actionUrl: '/posts/post-1',
      };

      mockNotificationRepository.create.mockResolvedValue(createdNotification);

      const result = await service.notifyNewComment('user-1', 'post-1', 'comment-1', 'John');

      expect(result).toEqual(createdNotification);
      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          title: 'Novo comentário',
          message: 'John comentou no seu post',
          type: 'INFO',
          relatedId: 'post-1',
          relatedType: 'POST',
          actionUrl: '/posts/post-1',
          isRead: false,
        })
      );
    });
  });

  describe('notifyNewFollower', () => {
    it('should create notification for new follower', async () => {
      const createdNotification = {
        id: 'notification-1',
        userId: 'user-1',
        title: 'Novo seguidor',
        message: 'John começou a seguir você',
        type: 'INFO',
        relatedId: 'follower-1',
        relatedType: 'USER',
        actionUrl: '/users/follower-1',
      };

      mockNotificationRepository.create.mockResolvedValue(createdNotification);

      const result = await service.notifyNewFollower('user-1', 'follower-1', 'John');

      expect(result).toEqual(createdNotification);
      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          title: 'Novo seguidor',
          message: 'John começou a seguir você',
          type: 'INFO',
          relatedId: 'follower-1',
          relatedType: 'USER',
          actionUrl: '/users/follower-1',
          isRead: false,
        })
      );
    });
  });
});
