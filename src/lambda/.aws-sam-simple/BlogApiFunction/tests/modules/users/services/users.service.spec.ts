import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../../../src/modules/users/services/users.service';
import { USER_REPOSITORY } from '../../../../src/database/tokens';

describe('UsersService', () => {
  let service: UsersService;

  const mockUserRepository = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findByCognitoSub: jest.fn(),
    findByUsername: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const createdUser = {
        id: '1',
        cognitoSub: '',
        name: 'Test User',
        fullName: 'Test User',
        email: 'test@example.com',
        passwordHash: 'password123',
        role: 'SUBSCRIBER',
        isActive: true,
        isBanned: false,
        postsCount: 0,
        commentsCount: 0,
        likesCount: 0,
        followersCount: 0,
        followingCount: 0,
      };

      mockUserRepository.create.mockResolvedValue(createdUser);

      const result = await service.createUser(userData);

      expect(result).toEqual(createdUser);
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Test User',
          nickname: 'Test User',
          role: 'SUBSCRIBER',
          isActive: true,
        })
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'testuser',
      };

      const users = [user];
      mockUserRepository.findAll.mockResolvedValue(users);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(user);
      expect(mockUserRepository.findAll).toHaveBeenCalled();
    });

    it('should return null when user not found by email', async () => {
      mockUserRepository.findAll.mockResolvedValue([]);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('isNameTaken', () => {
    it('should return true when name is already taken', async () => {
      const existingUser = {
        id: '1',
        name: 'takenname',
      };

      mockUserRepository.findByUsername.mockResolvedValue(existingUser);

      const result = await service.isNameTaken('takenname');

      expect(result).toBe(true);
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('takenname');
    });

    it('should return false when name is available', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(null);

      const result = await service.isNameTaken('newname');

      expect(result).toBe(false);
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('newname');
    });
  });

  describe('getUserById', () => {
    it('should return user when found by id', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'testuser',
      };

      mockUserRepository.findById.mockResolvedValue(user);

      const result = await service.getUserById('1');

      expect(result).toEqual(user);
      expect(mockUserRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should return null when user not found by id', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await service.getUserById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userId = '1';
      const updateData = {
        fullName: 'Updated Name',
      };

      const updatedUser = {
        id: userId,
        email: 'test@example.com',
        ...updateData,
      };

      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser(userId, updateData);

      expect(result).toEqual(updatedUser);
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, updateData);
    });

    it('should throw error when user not found', async () => {
      const userId = 'nonexistent';
      const updateData = {
        fullName: 'Updated Name',
      };

      mockUserRepository.update.mockResolvedValue(null);

      await expect(service.updateUser(userId, updateData)).rejects.toThrow('User not found');
    });
  });
});
