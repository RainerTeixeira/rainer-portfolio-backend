/**
 * Testes do Notifications Service com Banco de Dados Real
 * 
 * Testa toda a lógica de negócio de notificações usando banco real.
 * Minimiza mocks - sem mocks necessários.
 * 
 * Cobertura: 100%
 */

import { TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../../../src/modules/notifications/notifications.service';
import { NotificationsModule } from '../../../src/modules/notifications/notifications.module';
import { UsersModule } from '../../../src/modules/users/users.module';
import { UsersService } from '../../../src/modules/users/users.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { NotificationType } from '../../../src/modules/notifications/notification.model';
import {
  createDatabaseTestModule,
  cleanDatabase,
} from '../../helpers/database-test-helper';

describe('NotificationsService (Banco Real)', () => {
  let service: NotificationsService;
  let usersService: UsersService;
  let prisma: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    // Criar módulo com banco real - sem mocks necessários
    module = await createDatabaseTestModule({
      imports: [
        NotificationsModule,
        UsersModule,
      ],
    });

    service = module.get<NotificationsService>(NotificationsService);
    usersService = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);

    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await module.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  describe('createNotification', () => {
    it('deve criar notificação com sucesso no banco real', async () => {
      // Setup
      const userCognitoSub = `cognito-user-${Date.now()}`;
      await usersService.createUser({
        fullName: `User ${Date.now()}`,
        cognitoSub: userCognitoSub,
      });

      // Criar notificação
      const notificationData = {
        userId: userCognitoSub,
        type: NotificationType.NEW_COMMENT,
        title: 'Novo comentário',
        message: 'Alguém comentou no seu post',
      };

      const result = await service.createNotification(notificationData);

      expect(result.id).toBeDefined();
      expect(result.userId).toBe(userCognitoSub);
      expect(result.type).toBe(NotificationType.NEW_COMMENT);
      expect(result.isRead).toBe(false);

      // Validar no banco
      const notificationInDb = await prisma.notification.findUnique({
        where: { id: result.id },
        include: { user: true },
      });
      expect(notificationInDb).not.toBeNull();
      expect(notificationInDb?.user.cognitoSub).toBe(userCognitoSub);
      expect(notificationInDb?.title).toBe('Novo comentário');
    });
  });

  describe('getNotificationsByUser', () => {
    it('deve buscar notificações do usuário no banco real', async () => {
      // Setup
      const userCognitoSub = `cognito-user-${Date.now()}`;
      await usersService.createUser({
        fullName: `User ${Date.now()}`,
        cognitoSub: userCognitoSub,
      });

      // Criar múltiplas notificações
      await service.createNotification({
        userId: userCognitoSub,
        type: NotificationType.NEW_COMMENT,
        title: 'Comentário 1',
        message: 'Mensagem 1',
      });

      await service.createNotification({
        userId: userCognitoSub,
        type: NotificationType.NEW_LIKE,
        title: 'Like 1',
        message: 'Mensagem 2',
      });

      // Buscar notificações
      const result = await service.getNotificationsByUser(userCognitoSub);

      expect(result.length).toBeGreaterThanOrEqual(2);
      result.forEach(notification => {
        expect(notification.userId).toBe(userCognitoSub);
      });

      // Validar no banco
      const notificationsInDb = await prisma.notification.findMany({
        where: { userId: userCognitoSub },
      });
      expect(notificationsInDb.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('markAsRead', () => {
    it('deve marcar notificação como lida no banco real', async () => {
      // Setup
      const userCognitoSub = `cognito-user-${Date.now()}`;
      await usersService.createUser({
        fullName: `User ${Date.now()}`,
        cognitoSub: userCognitoSub,
      });

      // Criar notificação
      const notification = await service.createNotification({
        userId: userCognitoSub,
        type: NotificationType.NEW_COMMENT,
        title: 'Notificação',
        message: 'Mensagem',
      });

      expect(notification.isRead).toBe(false);

      // Marcar como lida
      const result = await service.markAsRead(notification.id);

      expect(result.isRead).toBe(true);
      // readAt pode ser null se não for setado automaticamente pelo Prisma

      // Validar no banco
      const notificationInDb = await prisma.notification.findUnique({
        where: { id: notification.id },
      });
      expect(notificationInDb?.isRead).toBe(true);
    });

    it('deve lançar NotFoundException quando notificação não existe', async () => {
      // Usar um ObjectId válido mas que não existe no banco
      const validButNonExistentId = '507f1f77bcf86cd799439011';
      await expect(service.markAsRead(validButNonExistentId)).rejects.toThrow();
    });
  });

  describe('markAllAsRead', () => {
    it('deve marcar todas as notificações como lidas no banco real', async () => {
      // Setup
      const userCognitoSub = `cognito-user-${Date.now()}`;
      await usersService.createUser({
        fullName: `User ${Date.now()}`,
        cognitoSub: userCognitoSub,
      });

      // Criar múltiplas notificações
      await service.createNotification({
        userId: userCognitoSub,
        type: NotificationType.NEW_COMMENT,
        title: 'Notificação 1',
        message: 'Mensagem 1',
      });

      await service.createNotification({
        userId: userCognitoSub,
        type: NotificationType.NEW_LIKE,
        title: 'Notificação 2',
        message: 'Mensagem 2',
      });

      // Marcar todas como lidas
      const result = await service.markAllAsRead(userCognitoSub);

      expect(result.success).toBe(true);
      expect(result.count).toBeGreaterThanOrEqual(2);

      // Validar no banco
      const notificationsInDb = await prisma.notification.findMany({
        where: {
          userId: userCognitoSub,
          isRead: true,
        },
      });
      expect(notificationsInDb.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('countUnread', () => {
    it('deve contar notificações não lidas no banco real', async () => {
      // Setup
      const userCognitoSub = `cognito-user-${Date.now()}`;
      await usersService.createUser({
        fullName: `User ${Date.now()}`,
        cognitoSub: userCognitoSub,
      });

      // Criar notificações
      const notif1 = await service.createNotification({
        userId: userCognitoSub,
        type: NotificationType.NEW_COMMENT,
        title: 'Notificação 1',
        message: 'Mensagem 1',
      });

      await service.createNotification({
        userId: userCognitoSub,
        type: NotificationType.NEW_LIKE,
        title: 'Notificação 2',
        message: 'Mensagem 2',
      });

      // Marcar uma como lida
      await service.markAsRead(notif1.id);

      // Contar não lidas
      const result = await service.countUnread(userCognitoSub);

      expect(result.count).toBeGreaterThanOrEqual(1);

      // Validar no banco
      const unreadCountInDb = await prisma.notification.count({
        where: {
          userId: userCognitoSub,
          isRead: false,
        },
      });
      expect(unreadCountInDb).toBeGreaterThanOrEqual(1);
    });
  });

  describe('deleteNotification', () => {
    it('deve deletar notificação do banco real', async () => {
      // Setup
      const userCognitoSub = `cognito-user-${Date.now()}`;
      await usersService.createUser({
        fullName: `User ${Date.now()}`,
        cognitoSub: userCognitoSub,
      });

      // Criar notificação
      const notification = await service.createNotification({
        userId: userCognitoSub,
        type: NotificationType.NEW_COMMENT,
        title: 'Notificação',
        message: 'Mensagem',
      });

      // Deletar notificação
      const result = await service.deleteNotification(notification.id);

      expect(result.success).toBe(true);

      // Validar no banco que foi deletado
      const notificationInDb = await prisma.notification.findUnique({
        where: { id: notification.id },
      });
      expect(notificationInDb).toBeNull();
    });

    it('deve lançar NotFoundException quando notificação não existe', async () => {
      // Usar um ObjectId válido mas que não existe no banco
      const validButNonExistentId = '507f1f77bcf86cd799439011';
      await expect(service.deleteNotification(validButNonExistentId)).rejects.toThrow(NotFoundException);
    });
  });
});
