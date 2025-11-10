/**
 * Testes do Users Repository com Banco Real
 * 
 * Testa o repository usando banco real.
 * Minimiza mocks - sem mocks necessários.
 */

import { TestingModule } from '@nestjs/testing';
import { UsersRepository } from '../../../src/modules/users/users.repository';
import { PrismaService } from '../../../src/prisma/prisma.service';
import {
  createDatabaseTestModule,
  cleanDatabase,
} from '../../helpers/database-test-helper';

describe('UsersRepository (Banco Real)', () => {
  let repository: UsersRepository;
  let prisma: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await createDatabaseTestModule({
      imports: [],
      providers: [UsersRepository, PrismaService],
    });

    repository = module.get<UsersRepository>(UsersRepository);
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

  it('should not have findByEmail method', () => {
    expect((repository as any).findByEmail).toBeUndefined();
  });

  it('should have findByCognitoSub method', () => {
    expect(repository.findByCognitoSub).toBeDefined();
    expect(typeof repository.findByCognitoSub).toBe('function');
  });

  it('should find user by cognitoSub no banco real', async () => {
    // Criar usuário no banco
    const cognitoSub = `cognito-test-${Date.now()}`;
    await prisma.user.create({
      data: {
        cognitoSub,
        fullName: 'Test User',
      },
    });

    // Buscar usando repository
    const user = await repository.findByCognitoSub(cognitoSub);
    
    expect(user).toBeDefined();
    expect(user?.cognitoSub).toBe(cognitoSub);
    expect(user?.fullName).toBe('Test User');
    expect(user).not.toHaveProperty('email');
  });

  it('should return null when user not found', async () => {
    const user = await repository.findByCognitoSub('non-existent-cognito-sub');
    
    expect(user).toBeNull();
  });
});
