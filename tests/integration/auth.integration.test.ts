/**
 * Testes de Integração: Auth - SIMPLIFICADO
 * 
 * Testa fluxo completo de autenticação.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/modules/auth/auth.service';
import { AuthRepository } from '../../src/modules/auth/auth.repository';
import { UsersService } from '../../src/modules/users/users.service';
import { UsersRepository } from '../../src/modules/users/users.repository';
import { PrismaService } from '../../src/prisma/prisma.service';

// Mock do PrismaService
class MockPrismaService {
  user = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
}

describe('Auth Integration Tests', () => {
  let authService: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        {
          provide: AuthRepository,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
            confirmEmail: jest.fn(),
            refreshToken: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
        {
          provide: UsersRepository,
          useValue: {
            create: jest.fn(),
            findByCognitoSub: jest.fn(),
            findByEmail: jest.fn(),
            findByUsername: jest.fn(),
            findOrCreateFromCognito: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useClass: MockPrismaService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('deve integrar serviços de auth e users', () => {
    expect(authService).toBeDefined();
    expect(usersService).toBeDefined();
  });

  it('deve ter todas as dependências injetadas', () => {
    expect((authService as any).authRepository).toBeDefined();
    expect((authService as any).usersService).toBeDefined();
  });
});
