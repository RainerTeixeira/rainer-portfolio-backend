/**
 * Testes Unitários: Users Service
 * 
 * Testa toda a lógica de negócio do serviço de usuários.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../../../src/modules/users/users.service';
import { UsersRepository } from '../../../src/modules/users/users.repository';
import { createMockUser } from '../../helpers/mocks';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByCognitoSub: jest.fn(),
            findByEmail: jest.fn(),
            findByUsername: jest.fn(),
            findMany: jest.fn(),
            findOrCreateFromCognito: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersRepository) as jest.Mocked<UsersRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const createData = {
      cognitoSub: 'cognito-sub-123',
      email: 'test@example.com',
      username: 'testuser',
      name: 'Test User',
    };

    it('deve criar usuário com sucesso', async () => {
      const mockUser = createMockUser(createData);
      repository.findByEmail.mockResolvedValue(null);
      repository.findByUsername.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockUser);

      const result = await service.createUser(createData);

      expect(repository.findByEmail).toHaveBeenCalledWith(createData.email);
      expect(repository.findByUsername).toHaveBeenCalledWith(createData.username);
      expect(repository.create).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockUser);
    });

    it('deve lançar ConflictException quando email já existe', async () => {
      const existingUser = createMockUser();
      repository.findByEmail.mockResolvedValue(existingUser);

      await expect(service.createUser(createData)).rejects.toThrow(ConflictException);
      await expect(service.createUser(createData)).rejects.toThrow('Email já está em uso');
    });

    it('deve lançar ConflictException quando username já existe', async () => {
      const existingUser = createMockUser();
      repository.findByEmail.mockResolvedValue(null);
      repository.findByUsername.mockResolvedValue(existingUser);

      await expect(service.createUser(createData)).rejects.toThrow(ConflictException);
      await expect(service.createUser(createData)).rejects.toThrow('Username já está em uso');
    });
  });

  describe('getUserById', () => {
    it('deve buscar usuário por ID com sucesso', async () => {
      const mockUser = createMockUser();
      repository.findById.mockResolvedValue(mockUser);

      const result = await service.getUserById('user-123');

      expect(repository.findById).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockUser);
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getUserById('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.getUserById('invalid-id')).rejects.toThrow('Usuário com ID invalid-id não encontrado');
    });
  });

  describe('getUserByCognitoSub', () => {
    it('deve buscar usuário por Cognito Sub com sucesso', async () => {
      const mockUser = createMockUser();
      repository.findByCognitoSub.mockResolvedValue(mockUser);

      const result = await service.getUserByCognitoSub('cognito-sub-123');

      expect(repository.findByCognitoSub).toHaveBeenCalledWith('cognito-sub-123');
      expect(result).toEqual(mockUser);
    });

    it('deve retornar null quando usuário não existe', async () => {
      repository.findByCognitoSub.mockResolvedValue(null);

      const result = await service.getUserByCognitoSub('invalid-sub');

      expect(result).toBeNull();
    });
  });

  describe('getUserByUsername', () => {
    it('deve buscar usuário por username com sucesso', async () => {
      const mockUser = createMockUser();
      repository.findByUsername.mockResolvedValue(mockUser);

      const result = await service.getUserByUsername('testuser');

      expect(repository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(result).toEqual(mockUser);
    });

    it('deve lançar NotFoundException quando username não existe', async () => {
      repository.findByUsername.mockResolvedValue(null);

      await expect(service.getUserByUsername('invalid')).rejects.toThrow(NotFoundException);
      await expect(service.getUserByUsername('invalid')).rejects.toThrow('Usuário @invalid não encontrado');
    });
  });

  describe('listUsers', () => {
    it('deve listar usuários com paginação padrão', async () => {
      const mockUsers = [createMockUser(), createMockUser({ id: 'user-456' })];
      const mockResult = {
        users: mockUsers,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      };

      repository.findMany.mockResolvedValue(mockResult);

      const result = await service.listUsers();

      expect(repository.findMany).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResult);
    });

    it('deve listar usuários com filtros e paginação customizada', async () => {
      const mockUsers = [createMockUser()];
      const mockResult = {
        users: mockUsers,
        pagination: {
          page: 2,
          limit: 5,
          total: 1,
          totalPages: 1,
        },
      };

      repository.findMany.mockResolvedValue(mockResult);

      const params = { page: 2, limit: 5, role: 'AUTHOR', search: 'test' };
      const result = await service.listUsers(params);

      expect(repository.findMany).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockResult);
    });
  });

  describe('updateUser', () => {
    const updateData = {
      name: 'Updated Name',
      bio: 'Updated bio',
    };

    it('deve atualizar usuário com sucesso', async () => {
      const mockUser = createMockUser();
      const updatedUser = createMockUser({ ...updateData });

      repository.findById.mockResolvedValue(mockUser);
      repository.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser('user-123', updateData);

      expect(repository.findById).toHaveBeenCalledWith('user-123');
      expect(repository.update).toHaveBeenCalledWith('user-123', updateData);
      expect(result).toEqual(updatedUser);
    });

    it('deve lançar ConflictException ao atualizar para email existente', async () => {
      const mockUser = createMockUser({ id: 'user-123' });
      const existingUser = createMockUser({ id: 'user-456', email: 'existing@example.com' });

      repository.findById.mockResolvedValue(mockUser);
      repository.findByEmail.mockResolvedValue(existingUser);

      await expect(service.updateUser('user-123', { email: 'existing@example.com' }))
        .rejects.toThrow(ConflictException);
      await expect(service.updateUser('user-123', { email: 'existing@example.com' }))
        .rejects.toThrow('Email já está em uso');
    });

    it('deve lançar ConflictException ao atualizar para username existente', async () => {
      const mockUser = createMockUser({ id: 'user-123' });
      const existingUser = createMockUser({ id: 'user-456', username: 'existinguser' });

      repository.findById.mockResolvedValue(mockUser);
      repository.findByEmail.mockResolvedValue(null);
      repository.findByUsername.mockResolvedValue(existingUser);

      await expect(service.updateUser('user-123', { username: 'existinguser' }))
        .rejects.toThrow(ConflictException);
      await expect(service.updateUser('user-123', { username: 'existinguser' }))
        .rejects.toThrow('Username já está em uso');
    });

    it('deve permitir atualizar para o próprio email/username', async () => {
      const mockUser = createMockUser({ id: 'user-123', email: 'test@example.com' });
      const updatedUser = createMockUser({ ...mockUser, name: 'Updated Name' });

      repository.findById.mockResolvedValue(mockUser);
      repository.findByEmail.mockResolvedValue(mockUser);
      repository.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser('user-123', { email: 'test@example.com', name: 'Updated Name' });

      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('deve deletar usuário com sucesso', async () => {
      const mockUser = createMockUser();
      repository.findById.mockResolvedValue(mockUser);
      repository.delete.mockResolvedValue(true);

      const result = await service.deleteUser('user-123');

      expect(repository.findById).toHaveBeenCalledWith('user-123');
      expect(repository.delete).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({
        success: true,
        message: expect.stringContaining('Usuário deletado com sucesso'),
      });
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.deleteUser('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('syncUserFromCognito', () => {
    const tokenPayload = {
      sub: 'cognito-sub-123',
      email: 'test@example.com',
      name: 'Test User',
      email_verified: true,
      'cognito:username': 'testuser',
    };

    it('deve criar usuário quando não existe', async () => {
      const mockUser = createMockUser(tokenPayload);
      repository.findOrCreateFromCognito.mockResolvedValue(mockUser);

      const result = await service.syncUserFromCognito(tokenPayload);

      expect(repository.findOrCreateFromCognito).toHaveBeenCalledWith({
        cognitoSub: tokenPayload.sub,
        email: tokenPayload.email,
        name: tokenPayload.name,
        username: tokenPayload['cognito:username'],
      });
      expect(result).toEqual(mockUser);
    });

    it('deve sincronizar dados quando email mudou no Cognito', async () => {
      const oldUser = createMockUser({ email: 'old@example.com' });
      const updatedUser = createMockUser({ email: tokenPayload.email });

      repository.findOrCreateFromCognito.mockResolvedValue(oldUser);
      repository.update.mockResolvedValue(updatedUser);

      await service.syncUserFromCognito(tokenPayload);

      expect(repository.update).toHaveBeenCalledWith(oldUser.id, {
        email: tokenPayload.email,
        name: tokenPayload.name,
      });
    });

    it('deve usar email como username quando cognito:username não existe', async () => {
      const payload = {
        sub: 'cognito-sub-123',
        email: 'test@example.com',
        name: 'Test User',
        email_verified: true,
      };

      const mockUser = createMockUser();
      repository.findOrCreateFromCognito.mockResolvedValue(mockUser);

      await service.syncUserFromCognito(payload);

      expect(repository.findOrCreateFromCognito).toHaveBeenCalledWith({
        cognitoSub: payload.sub,
        email: payload.email,
        name: payload.name,
        username: 'test',
      });
    });

    it('deve usar nome padrão quando name não está presente', async () => {
      const payload = {
        sub: 'cognito-sub-123',
        email: 'test@example.com',
        email_verified: true,
      } as any;

      const mockUser = createMockUser();
      repository.findOrCreateFromCognito.mockResolvedValue(mockUser);

      await service.syncUserFromCognito(payload);

      expect(repository.findOrCreateFromCognito).toHaveBeenCalledWith({
        cognitoSub: payload.sub,
        email: payload.email,
        name: 'Novo Usuário',
        username: 'test',
      });
    });

    it('deve sincronizar apenas name quando email não mudou', async () => {
      const payload = {
        sub: 'cognito-sub-123',
        email: 'test@example.com',
        name: 'Updated Name',
        email_verified: true,
        'cognito:username': 'testuser',
      };

      const oldUser = createMockUser({ 
        email: 'test@example.com', 
        name: 'Old Name' 
      });

      repository.findOrCreateFromCognito.mockResolvedValue(oldUser);
      repository.update.mockResolvedValue({ ...oldUser, name: 'Updated Name' });

      await service.syncUserFromCognito(payload);

      expect(repository.update).toHaveBeenCalledWith(oldUser.id, {
        email: payload.email,
        name: payload.name,
      });
    });

    it('deve manter nome do usuário quando Cognito não tem name', async () => {
      const payload = {
        sub: 'cognito-sub-123',
        email: 'newemail@example.com',
        email_verified: true,
        'cognito:username': 'testuser',
      } as any;

      const oldUser = createMockUser({ 
        email: 'oldemail@example.com', 
        name: 'Existing Name' 
      });

      repository.findOrCreateFromCognito.mockResolvedValue(oldUser);
      repository.update.mockResolvedValue({ ...oldUser, email: 'newemail@example.com' });

      await service.syncUserFromCognito(payload);

      expect(repository.update).toHaveBeenCalledWith(oldUser.id, {
        email: 'newemail@example.com',
        name: 'Existing Name', // Mantém o nome existente
      });
    });
  });

  describe('banUser', () => {
    it('deve banir usuário com sucesso', async () => {
      const mockUser = createMockUser({ isBanned: true, isActive: false });
      repository.update.mockResolvedValue(mockUser);

      const result = await service.banUser('user-123', 'Comportamento inadequado');

      expect(repository.update).toHaveBeenCalledWith('user-123', {
        isBanned: true,
        isActive: false,
        banReason: 'Comportamento inadequado',
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('unbanUser', () => {
    it('deve desbanir usuário com sucesso', async () => {
      const mockUser = createMockUser({ isBanned: false, isActive: true });
      repository.update.mockResolvedValue(mockUser);

      const result = await service.unbanUser('user-123');

      expect(repository.update).toHaveBeenCalledWith('user-123', {
        isBanned: false,
        isActive: true,
        banReason: undefined,
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUserRole', () => {
    it('deve atualizar role do usuário com sucesso', async () => {
      const { UserRole } = require('../../../src/modules/users/user.model');
      const mockUser = createMockUser({ role: UserRole.ADMIN });
      repository.update.mockResolvedValue(mockUser);

      const result = await service.updateUserRole('user-123', 'ADMIN');

      expect(repository.update).toHaveBeenCalledWith('user-123', {
        role: 'ADMIN',
      });
      expect(result).toEqual(mockUser);
    });
  });
});

