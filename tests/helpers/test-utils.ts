/**
 * Utilitários para Testes
 * 
 * Funções auxiliares para facilitar a escrita de testes.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

/**
 * Cria um módulo de teste do NestJS
 */
export async function createTestingModule(moduleMetadata: any): Promise<TestingModule> {
  const module: TestingModule = await Test.createTestingModule(moduleMetadata).compile();
  return module;
}

/**
 * Cria uma aplicação NestJS para testes E2E
 */
export async function createTestApp(moduleMetadata: any): Promise<INestApplication> {
  const moduleFixture: TestingModule = await createTestingModule(moduleMetadata);
  const app = moduleFixture.createNestApplication();
  await app.init();
  return app;
}

/**
 * Aguarda um tempo específico (para testes assíncronos)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Espera uma Promise ser resolvida ou rejeitada
 */
export async function expectAsync<T>(
  promise: Promise<T>
): Promise<{ success: boolean; value?: T; error?: any }> {
  try {
    const value = await promise;
    return { success: true, value };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Verifica se uma função lança um erro específico
 */
export async function expectToThrow(
  fn: () => Promise<any>,
  errorType: any,
  errorMessage?: string
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error: any) {
    expect(error).toBeInstanceOf(errorType);
    if (errorMessage) {
      expect(error.message).toContain(errorMessage);
    }
  }
}

/**
 * Mock de função com implementação customizada
 */
export function mockFunction<T extends (...args: any[]) => any>(
  implementation?: T
): jest.MockedFunction<T> {
  return jest.fn(implementation) as jest.MockedFunction<T>;
}

/**
 * Reseta todos os mocks
 */
export function resetAllMocks(): void {
  jest.clearAllMocks();
  jest.resetAllMocks();
  jest.restoreAllMocks();
}

