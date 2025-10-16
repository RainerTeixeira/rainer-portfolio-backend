/**
 * Testes Unitários: Users Repository
 * 
 * Testa toda a camada de acesso a dados de usuários.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from '../../../src/modules/users/users.repository';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { createMockPrismaService, createMockUser } from '../../helpers/mocks';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: PrismaService,
          useValue: createMockPrismaService(),
        },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
    prisma = module.get(PrismaService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar usuário com sucesso', async () => {
      const createData = {
        cognitoSub: 'cognito-sub-123',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      };

      const mockUser = createMockUser(createData);
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await repository.create(createData);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: createData,
      });
      expect(result).toEqual(mockUser);
    });

    it('deve criar usuário com dados opcionais', async () => {
      const { UserRole } = require('../../../src/modules/users/user.model');
      const createData = {
        cognitoSub: 'cognito-sub-123',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
        website: 'https://example.com',
        socialLinks: { twitter: '@test' },
        role: UserRole.ADMIN,
      };

      const mockUser = createMockUser({ ...createData, role: UserRole.ADMIN });
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await repository.create(createData);

      expect(result).toEqual(mockUser);
    });
  });

  describe('findById', () => {
    it('deve buscar usuário por ID com sucesso', async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findById('user-123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(result).toEqual(mockUser);
    });

    it('deve retornar null quando usuário não existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('findByCognitoSub', () => {
    it('deve buscar usuário por Cognito Sub com sucesso', async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findByCognitoSub('cognito-sub-123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { cognitoSub: 'cognito-sub-123' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByEmail', () => {
    it('deve buscar usuário por email com sucesso', async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findByEmail('test@example.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByUsername', () => {
    it('deve buscar usuário por username com sucesso', async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findByUsername('testuser');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findMany', () => {
    it('deve listar usuários sem filtros', async () => {
      const mockUsers = [createMockUser(), createMockUser({ id: 'user-456' })];
      prisma.user.findMany.mockResolvedValue(mockUsers);
      prisma.user.count.mockResolvedValue(2);

      const result = await repository.findMany({});

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual({
        users: mockUsers,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it('deve listar usuários com filtros e paginação', async () => {
      const mockUsers = [createMockUser()];
      prisma.user.findMany.mockResolvedValue(mockUsers);
      prisma.user.count.mockResolvedValue(1);

      const result = await repository.findMany({
        page: 2,
        limit: 5,
        role: 'AUTHOR',
        isActive: true,
        search: 'test',
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          role: 'AUTHOR',
          isActive: true,
          OR: [
            { name: { contains: 'test', mode: 'insensitive' } },
            { email: { contains: 'test', mode: 'insensitive' } },
            { username: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        skip: 5,
        take: 5,
        orderBy: { createdAt: 'desc' },
      });
      expect(result.pagination.page).toBe(2);
    });
  });

  describe('update', () => {
    it('deve atualizar usuário com sucesso', async () => {
      const updateData = {
        name: 'Updated Name',
        bio: 'Updated bio',
      };

      const mockUser = createMockUser(updateData);
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await repository.update('user-123', updateData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: updateData,
      });
      expect(result).toEqual(mockUser);
    });

    it('deve atualizar todos os campos permitidos', async () => {
      const { UserRole } = require('../../../src/modules/users/user.model');
      const updateData = {
        email: 'new@example.com',
        username: 'newusername',
        name: 'New Name',
        avatar: 'https://example.com/new-avatar.jpg',
        bio: 'New bio',
        website: 'https://newsite.com',
        socialLinks: { twitter: '@new' },
        role: UserRole.ADMIN,
        isActive: false,
        isBanned: true,
        banReason: 'Violação de termos',
      };

      const mockUser = createMockUser({ ...updateData, role: UserRole.ADMIN });
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await repository.update('user-123', updateData);

      expect(result).toEqual(mockUser);
    });
  });

  describe('delete', () => {
    it('deve deletar usuário com sucesso', async () => {
      prisma.user.delete.mockResolvedValue(createMockUser());

      const result = await repository.delete('user-123');

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(result).toBe(true);
    });
  });

  describe('incrementPostsCount', () => {
    it('deve incrementar contador de posts', async () => {
      const mockUser = createMockUser({ postsCount: 1 });
      prisma.user.update.mockResolvedValue(mockUser);

      await repository.incrementPostsCount('user-123');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { postsCount: { increment: 1 } },
      });
    });
  });

  describe('decrementPostsCount', () => {
    it('deve decrementar contador de posts', async () => {
      const mockUser = createMockUser({ postsCount: 0 });
      prisma.user.update.mockResolvedValue(mockUser);

      await repository.decrementPostsCount('user-123');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { postsCount: { decrement: 1 } },
      });
    });
  });

  describe('incrementCommentsCount', () => {
    it('deve incrementar contador de comentários', async () => {
      const mockUser = createMockUser({ commentsCount: 1 });
      prisma.user.update.mockResolvedValue(mockUser);

      await repository.incrementCommentsCount('user-123');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { commentsCount: { increment: 1 } },
      });
    });
  });

  describe('findOrCreateFromCognito', () => {
    const cognitoData = {
      cognitoSub: 'cognito-sub-123',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
    };

    it('deve retornar usuário existente', async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findOrCreateFromCognito(cognitoData);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { cognitoSub: cognitoData.cognitoSub },
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('deve criar novo usuário quando não existe', async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await repository.findOrCreateFromCognito(cognitoData);

      expect(prisma.user.findUnique).toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('deve usar email como username quando não fornecido', async () => {
      const dataWithoutUsername = {
        cognitoSub: 'cognito-sub-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      await repository.findOrCreateFromCognito(dataWithoutUsername);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          username: 'test',
        }),
      });
    });
  });
});

