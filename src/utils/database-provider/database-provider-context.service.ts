/**
 * Serviço para gerenciar o contexto do database provider por requisição
 * 
 * Este serviço usa AsyncLocalStorage para armazenar o provider
 * escolhido em cada requisição sem poluir o código.
 * 
 * Suporta 3 cenários:
 * 1. PRISMA → MongoDB + Prisma (local)
 * 2. DYNAMODB → DynamoDB Local (desenvolvimento)
 * 3. DYNAMODB → DynamoDB AWS (produção)
 * 
 * @module utils/database-provider/database-provider-context.service
 */

import { Injectable, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * Tipo do provider de banco de dados
 * - PRISMA: MongoDB com Prisma (sempre local)
 * - DYNAMODB: DynamoDB (local ou AWS, detecta automaticamente)
 */
export type DatabaseProvider = 'PRISMA' | 'DYNAMODB';

/**
 * Tipo do ambiente DynamoDB
 */
export type DynamoDBEnvironment = 'LOCAL' | 'AWS';

/**
 * Interface do contexto armazenado
 */
interface DatabaseProviderContext {
  provider: DatabaseProvider;
}

/**
 * Serviço de contexto do database provider
 * 
 * Permite armazenar e recuperar o provider escolhido
 * para cada requisição sem precisar passar como parâmetro.
 * 
 * Detecta automaticamente se DynamoDB é local ou AWS baseado
 * na presença da variável DYNAMODB_ENDPOINT.
 * 
 * @example
 * // No interceptor
 * this.databaseProviderContext.setProvider('DYNAMODB');
 * 
 * // No serviço
 * const provider = this.databaseProviderContext.getProvider();
 * 
 * if (this.databaseProviderContext.isPrisma()) {
 *   // MongoDB + Prisma (local)
 * } else if (this.databaseProviderContext.isDynamoDBLocal()) {
 *   // DynamoDB Local
 * } else if (this.databaseProviderContext.isDynamoDBCloud()) {
 *   // DynamoDB AWS
 * }
 */
@Injectable({ scope: Scope.DEFAULT })
export class DatabaseProviderContextService {
  private asyncLocalStorage = new AsyncLocalStorage<DatabaseProviderContext>();

  /**
   * Define o provider para a requisição atual
   */
  setProvider(provider: DatabaseProvider): void {
    const store = this.asyncLocalStorage.getStore();
    if (store) {
      store.provider = provider;
    }
  }

  /**
   * Obtém o provider da requisição atual
   * Se não houver, retorna o padrão do .env
   */
  getProvider(): DatabaseProvider {
    const store = this.asyncLocalStorage.getStore();
    if (store?.provider) {
      return store.provider;
    }

    // Fallback para variável de ambiente
    const envProvider = process.env.DATABASE_PROVIDER?.toUpperCase();
    return (envProvider === 'DYNAMODB' ? 'DYNAMODB' : 'PRISMA') as DatabaseProvider;
  }

  /**
   * Executa uma função dentro de um contexto com provider específico
   */
  run<T>(provider: DatabaseProvider, callback: () => T): T {
    return this.asyncLocalStorage.run({ provider }, callback);
  }

  /**
   * Verifica se está usando Prisma (MongoDB local)
   */
  isPrisma(): boolean {
    return this.getProvider() === 'PRISMA';
  }

  /**
   * Verifica se está usando DynamoDB (local ou AWS)
   */
  isDynamoDB(): boolean {
    return this.getProvider() === 'DYNAMODB';
  }

  /**
   * Verifica se DynamoDB é local ou AWS
   * 
   * Local = tem DYNAMODB_ENDPOINT definido (http://localhost:8000)
   * AWS = não tem DYNAMODB_ENDPOINT (usa AWS SDK padrão)
   */
  getDynamoDBEnvironment(): DynamoDBEnvironment {
    return process.env.DYNAMODB_ENDPOINT ? 'LOCAL' : 'AWS';
  }

  /**
   * Verifica se está usando DynamoDB Local
   */
  isDynamoDBLocal(): boolean {
    return this.isDynamoDB() && this.getDynamoDBEnvironment() === 'LOCAL';
  }

  /**
   * Verifica se está usando DynamoDB na AWS (nuvem)
   */
  isDynamoDBCloud(): boolean {
    return this.isDynamoDB() && this.getDynamoDBEnvironment() === 'AWS';
  }

  /**
   * Retorna descrição amigável do ambiente atual
   */
  getEnvironmentDescription(): string {
    const provider = this.getProvider();
    
    if (provider === 'PRISMA') {
      return 'MongoDB + Prisma (Local)';
    }
    
    if (provider === 'DYNAMODB') {
      const env = this.getDynamoDBEnvironment();
      return env === 'LOCAL' 
        ? 'DynamoDB Local (Desenvolvimento)'
        : 'DynamoDB AWS (Produção)';
    }
    
    return 'Unknown';
  }

  /**
   * Retorna informações completas do ambiente
   */
  getEnvironmentInfo() {
    const provider = this.getProvider();
    const description = this.getEnvironmentDescription();
    
    const info: any = {
      provider,
      description,
      isPrisma: this.isPrisma(),
      isDynamoDB: this.isDynamoDB(),
    };

    if (this.isDynamoDB()) {
      info.dynamodbEnvironment = this.getDynamoDBEnvironment();
      info.isDynamoDBLocal = this.isDynamoDBLocal();
      info.isDynamoDBCloud = this.isDynamoDBCloud();
      info.endpoint = process.env.DYNAMODB_ENDPOINT || 'AWS Default';
    } else {
      info.databaseUrl = process.env.DATABASE_URL ? '(configured)' : '(not set)';
    }

    return info;
  }
}


