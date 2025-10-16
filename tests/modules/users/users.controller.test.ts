/**
 * Testes Unitários: Users Controller
 * 
 * Testa todos os endpoints do controller de usuários.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../../../src/modules/users/users.controller';
import { UsersService } from '../../../src/modules/users/users.service';
import { createMockUser } from '../../helpers/mocks';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            createUser: jest.fn(),
            listUsers: jest.fn(),
            getUserById: jest.fn(),
            getUserByUsername: jest.fn(),
            updateUser: jest.fn(),
            deleteUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService) as jest.Mocked<UsersService>;
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
        password: 'Test@123',
      };

      const mockUser = createMockUser();
      service.createUser.mockResolvedValue(mockUser);

      const result = await controller.create(createData);

      expect(service.createUser).toHaveBeenCalledWith(createData);
      expect(result).toEqual({
        success: true,
        data: mockUser,
      });
    });
  });

  describe('list', () => {
    it('deve listar usuários sem filtros', async () => {
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

      service.listUsers.mockResolvedValue(mockResult);

      const result = await controller.list();

      expect(service.listUsers).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        role: undefined,
        search: undefined,
      });
      expect(result).toEqual({
        success: true,
        ...mockResult,
      });
    });

    it('deve listar usuários com filtros e paginação', async () => {
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

      service.listUsers.mockResolvedValue(mockResult);

      const result = await controller.list(2, 5, 'AUTHOR', 'test');

      expect(service.listUsers).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        role: 'AUTHOR',
        search: 'test',
      });
      expect(result).toEqual({
        success: true,
        ...mockResult,
      });
    });
  });

  describe('findById', () => {
    it('deve buscar usuário por ID com sucesso', async () => {
      const mockUser = createMockUser();
      service.getUserById.mockResolvedValue(mockUser);

      const result = await controller.findById('user-123');

      expect(service.getUserById).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({
        success: true,
        data: mockUser,
      });
    });
  });

  describe('findByUsername', () => {
    it('deve buscar usuário por username com sucesso', async () => {
      const mockUser = createMockUser();
      service.getUserByUsername.mockResolvedValue(mockUser);

      const result = await controller.findByUsername('testuser');

      expect(service.getUserByUsername).toHaveBeenCalledWith('testuser');
      expect(result).toEqual({
        success: true,
        data: mockUser,
      });
    });
  });

  describe('update', () => {
    it('deve atualizar usuário com sucesso', async () => {
      const updateData = {
        name: 'Updated Name',
        bio: 'Updated bio',
      };

      const mockUser = createMockUser(updateData);
      service.updateUser.mockResolvedValue(mockUser);

      const result = await controller.update('user-123', updateData);

      expect(service.updateUser).toHaveBeenCalledWith('user-123', updateData);
      expect(result).toEqual({
        success: true,
        data: mockUser,
      });
    });
  });

  describe('delete', () => {
    it('deve deletar usuário com sucesso', async () => {
      const mockResult = {
        success: true,
        message: 'Usuário deletado com sucesso',
      };

      service.deleteUser.mockResolvedValue(mockResult);

      const result = await controller.deleteUser('user-123');

      expect(service.deleteUser).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockResult);
    });
  });
});

