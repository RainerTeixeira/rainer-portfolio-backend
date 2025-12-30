import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../../../../src/modules/users/controllers/users.controller';
import { UsersService } from '../../../../src/modules/users/services/users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    createUser: jest.fn(),
    getUserById: jest.fn(),
    findAll: jest.fn(),
    findProfile: jest.fn(),
    getUserByCognitoSub: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    findByEmail: jest.fn(),
    checkNicknameAvailability: jest.fn(),
    updateUserNickname: jest.fn(),
    isNameTaken: jest.fn(),
    listUsers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
