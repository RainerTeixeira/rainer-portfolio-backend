/**
 * Helper para Testes com Banco de Dados Real
 * 
 * Fornece utilitários para criar módulos de teste que usam banco de dados real
 * ao invés de mocks. Isso torna os testes mais próximos do ambiente de produção.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../src/prisma/prisma.module.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { DatabaseProviderModule } from '../../src/utils/database-provider/index.js';

/**
 * Limpa todas as coleções do banco de dados
 * 
 * IMPORTANTE: Deleta em ordem reversa das dependências para evitar erros de foreign key.
 * Por exemplo: notifications -> bookmarks -> likes -> comments -> posts -> categories -> users
 */
export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  try {
    // Deletar em ordem reversa das dependências (filhos primeiro, depois pais)
    await prisma.notification.deleteMany({});
    await prisma.bookmark.deleteMany({});
    await prisma.like.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.post.deleteMany({});
    // Subcategorias primeiro (têm parentId)
    await prisma.category.deleteMany({
      where: { parentId: { not: null } },
    });
    // Categorias principais depois
    await prisma.category.deleteMany({
      where: { parentId: null },
    });
    await prisma.user.deleteMany({});
  } catch (error) {
    // Log do erro mas não falha o teste
    console.warn('Erro ao limpar banco de dados:', error);
    // Tenta limpar novamente com método alternativo se necessário
    try {
      await prisma.$runCommandRaw({
        delete: 'notifications',
        deletes: [{ q: {}, limit: 0 }],
      });
      await prisma.$runCommandRaw({
        delete: 'bookmarks',
        deletes: [{ q: {}, limit: 0 }],
      });
      await prisma.$runCommandRaw({
        delete: 'likes',
        deletes: [{ q: {}, limit: 0 }],
      });
      await prisma.$runCommandRaw({
        delete: 'comments',
        deletes: [{ q: {}, limit: 0 }],
      });
      await prisma.$runCommandRaw({
        delete: 'posts',
        deletes: [{ q: {}, limit: 0 }],
      });
      await prisma.$runCommandRaw({
        delete: 'categories',
        deletes: [{ q: {}, limit: 0 }],
      });
      await prisma.$runCommandRaw({
        delete: 'users',
        deletes: [{ q: {}, limit: 0 }],
      });
    } catch (fallbackError) {
      // Ignora erro se coleção não existir ou método não funcionar
      console.warn('Método alternativo de limpeza também falhou:', fallbackError);
    }
  }
}

/**
 * Configuração base para módulos de teste com banco real
 */
export interface DatabaseTestModuleOptions {
  /**
   * Módulos adicionais a serem importados (além dos módulos base)
   */
  imports?: any[];
  /**
   * Providers adicionais
   */
  providers?: any[];
  /**
   * Controllers adicionais
   */
  controllers?: any[];
}

/**
 * Cria um módulo de teste com banco de dados real
 * 
 * @param options Opções de configuração do módulo
 * @returns Módulo de teste configurado com banco real
 */
export async function createDatabaseTestModule(
  options: DatabaseTestModuleOptions = {}
): Promise<TestingModule> {
  // Forçar uso do Prisma nos testes
  process.env.DATABASE_PROVIDER = 'PRISMA';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/blog-test';
  
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      // Configuração global de ambiente
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env',
      }),
      
      // Database Provider Selector
      DatabaseProviderModule,
      
      // Prisma Module (banco real)
      PrismaModule,
      
      // Módulos adicionais do usuário
      ...(options.imports || []),
    ],
    providers: options.providers || [],
    controllers: options.controllers || [],
  }).compile();

  return module;
}

/**
 * Setup completo para testes com banco real
 * 
 * Cria o módulo, limpa o banco e retorna os serviços necessários
 */
export interface DatabaseTestSetup<T = any> {
  module: TestingModule;
  prisma: PrismaService;
  service: T;
  /**
   * Função para limpar o banco antes de cada teste
   */
  clean: () => Promise<void>;
  /**
   * Função para fechar conexões após os testes
   */
  close: () => Promise<void>;
}

/**
 * Cria setup completo para testes de serviço com banco real
 * 
 * @param ServiceClass Classe do serviço a ser testado
 * @param options Opções de configuração do módulo
 * @returns Setup completo com serviços e helpers
 */
export async function createDatabaseTestSetup<T>(
  ServiceClass: new (...args: any[]) => T,
  options: DatabaseTestModuleOptions = {}
): Promise<DatabaseTestSetup<T>> {
  const module = await createDatabaseTestModule(options);
  
  const prisma = module.get<PrismaService>(PrismaService);
  const service = module.get<T>(ServiceClass);

  // Conectar ao banco
  await prisma.$connect();

  return {
    module,
    prisma,
    service,
    clean: async () => {
      await cleanDatabase(prisma);
    },
    close: async () => {
      await prisma.$disconnect();
      await module.close();
    },
  };
}

/**
 * Retorna função para limpar banco (usar em beforeEach)
 * 
 * @example
 * ```typescript
 * beforeEach(async () => {
 *   await cleanDatabase(prisma);
 * });
 * ```
 */
export { cleanDatabase as setupDatabaseCleanup };

/**
 * Retorna função para fechar conexões (usar em afterAll)
 * 
 * @example
 * ```typescript
 * afterAll(async () => {
 *   await prisma.$disconnect();
 *   await module.close();
 * });
 * ```
 */
export function setupDatabaseTeardown(prisma: PrismaService, module: TestingModule): () => Promise<void> {
  return async () => {
    await prisma.$disconnect();
    await module.close();
  };
}

