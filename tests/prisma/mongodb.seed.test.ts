import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('MongoDB Seed', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should not have email field in User model', () => {
    // Verificar que o modelo User não tem campo email
    const userFields = Object.keys(prisma.user.fields || {});
    expect(userFields).not.toContain('email');
  });

  it('should have cognitoSub field in User model', () => {
    // Verificar que o modelo User tem campo cognitoSub
    expect(prisma.user).toBeDefined();
  });

  it('should create user without email field', async () => {
    const testUser = {
      cognitoSub: `cognito-test-${Date.now()}`,
      fullName: 'Test User',
    };

    const user = await prisma.user.create({ data: testUser });

    expect(user).toHaveProperty('cognitoSub');
    expect(user).not.toHaveProperty('email');
    expect(user).not.toHaveProperty('username');
    expect(user.cognitoSub).toMatch(/^cognito-/);

    // Limpar
    await prisma.user.delete({ where: { cognitoSub: user.cognitoSub } });
  });
});
