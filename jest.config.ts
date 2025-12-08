import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.model.ts',
    '!src/**/*.schema.ts',
    '!src/**/index.ts',
    '!src/main.ts',
    '!src/app.module.ts',
    '!src/lambda/**',
    '!src/prisma/mongodb.seed.ts',
    '!src/prisma/dynamodb.seed.ts',
    '!src/prisma/dynamodb.tables.ts',
    '!src/prisma/OLD_*.ts',
  ],
  coverageDirectory: 'tests/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  verbose: true,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          moduleResolution: 'node',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          // Garantir que os testes enxerguem os tipos globais do Jest
          types: ['node', 'jest'],
        },
      },
    ],
  },
  testTimeout: 60000, // 60 segundos para testes de integração com banco
  maxWorkers: '50%',
};

export default config;

