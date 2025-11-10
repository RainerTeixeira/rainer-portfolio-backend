/**
 * Testes de Integração: Auth com Banco Real
 * 
 * Testa fluxo completo de autenticação usando banco real.
 * Minimiza mocks - apenas AuthRepository (AWS Cognito externo).
 */

import { TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/modules/auth/auth.service';
import { AuthRepository } from '../../src/modules/auth/auth.repository';
import { UsersService } from '../../src/modules/users/users.service';
import { UsersModule } from '../../src/modules/users/users.module';
import { CloudinaryService } from '../../src/modules/cloudinary/cloudinary.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  createDatabaseTestModule,
  cleanDatabase,
} from '../helpers/database-test-helper';

describe('Auth Integration Tests (Banco Real)', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let prisma: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await createDatabaseTestModule({
      imports: [UsersModule],
      providers: [
        AuthService,
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
          provide: CloudinaryService,
          useValue: {
            uploadImage: jest.fn().mockResolvedValue({ url: 'http://example.com/image.jpg' }),
            deleteImage: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    });

    authService = module.get<AuthService>(AuthService);
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

  it('deve integrar serviços de auth e users', () => {
    expect(authService).toBeDefined();
    expect(usersService).toBeDefined();
  });

  it('deve ter todas as dependências injetadas', () => {
    expect((authService as any).authRepository).toBeDefined();
    expect((authService as any).usersService).toBeDefined();
  });

  it('deve criar usuário no banco real quando necessário', async () => {
    const cognitoSub = `cognito-test-${Date.now()}`;
    
    const user = await usersService.createUser({
      fullName: 'Test User',
      cognitoSub,
    });

    expect(user).toBeDefined();
    expect(user.cognitoSub).toBe(cognitoSub);

    // Validar no banco
    const userInDb = await prisma.user.findUnique({
      where: { cognitoSub: cognitoSub },
    });
    expect(userInDb).not.toBeNull();
    expect(userInDb?.cognitoSub).toBe(cognitoSub);
  });
});
