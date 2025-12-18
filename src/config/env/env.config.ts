/**
 * @fileoverview Configurações de Variáveis de Ambiente
 * 
 * Módulo responsável por gerenciar todas as variáveis de ambiente
 * necessárias para o funcionamento da aplicação serverless.
 * 
 * @module config/env/env.config
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import { ConfigModuleOptions } from '@nestjs/config';

/**
 * Opções de configuração para o ConfigModule do NestJS.
 * 
 * Responsável por:
 * - Carregar variáveis de ambiente de múltiplos arquivos
 * - Disponibilizar configurações globalmente na aplicação
 * - Definir ordem de prioridade dos arquivos .env
 * 
 * @const envConfig
 * @type {ConfigModuleOptions}
 * 
 * @example
 * ```typescript
 * // Uso no app.module.ts
 * import { envConfig } from './config/env/env.config';
 * 
 * @Module({
 *   imports: [ConfigModule.forRoot(envConfig)]
 * })
 * export class AppModule {}
 * ```
 */
export const envConfig: ConfigModuleOptions = {
  /**
   * Disponibiliza ConfigService globalmente em todos os módulos.
   * Não é necessário importar ConfigModule em outros lugares.
   */
  isGlobal: true,
  
  /**
   * Ordem de prioridade dos arquivos de ambiente:
   * 1. .env.local (override específico do ambiente)
   * 2. .env (configurações padrão)
   * 
   * Arquivos posteriores na lista têm prioridade menor.
   */
  envFilePath: ['.env.local', '.env'],
};

/**
 * Interface para validação das variáveis de ambiente.
 * 
 * Define o contrato das variáveis esperadas pela aplicação,
 * garantindo type safety e documentando todas as configurações.
 * 
 * @interface EnvironmentVariables
 * 
 * @example
 * ```typescript
 * // Validação de ambiente
 * const env = process.env as EnvironmentVariables;
 * 
 * if (!env.AWS_REGION) {
 *   throw new Error('AWS_REGION é obrigatório');
 * }
 * ```
 */
export interface EnvironmentVariables {
  // AWS Configuration
  /** Região AWS onde os serviços estão hospedados */
  AWS_REGION: string;
  /** Access Key ID da AWS (opcional, pode usar IAM Role) */
  AWS_ACCESS_KEY_ID?: string;
  /** Secret Access Key da AWS (opcional, pode usar IAM Role) */
  AWS_SECRET_ACCESS_KEY?: string;

  // DynamoDB Configuration
  /** Nome da tabela DynamoDB principal */
  DYNAMODB_TABLE: string;
  /** Endpoint local do DynamoDB para desenvolvimento */
  DYNAMODB_LOCAL_ENDPOINT?: string;

  // Cognito Configuration
  /** ID do User Pool do Cognito */
  COGNITO_USER_POOL_ID: string;
  /** ID da aplicação cliente no Cognito */
  COGNITO_CLIENT_ID: string;
  /** Segredo da aplicação cliente (opcional) */
  COGNITO_CLIENT_SECRET?: string;

  // JWT Configuration
  /** Segredo para assinatura de tokens JWT */
  JWT_SECRET: string;
  /** Tempo de expiração dos tokens JWT */
  JWT_EXPIRES_IN: string;

  // Application Configuration
  /** Ambiente da aplicação */
  NODE_ENV: 'development' | 'staging' | 'production';
  /** Porta do servidor (opcional, padrão 3000) */
  PORT?: number;

  // Lambda Configuration
  /** Nome da função Lambda (opcional) */
  LAMBDA_FUNCTION_NAME?: string;
  /** Memória alocada para Lambda em MB (opcional) */
  LAMBDA_MEMORY_SIZE?: number;
  /** Timeout da Lambda em segundos (opcional) */
  LAMBDA_TIMEOUT?: number;
}

/**
 * Valores padrão para variáveis de ambiente.
 * 
 * Fornece configurações padrão para desenvolvimento local,
 * evitando a necessidade de configurar todas as variáveis
 * manualmente durante o desenvolvimento.
 * 
 * @const defaultEnvironment
 * @type {Partial<EnvironmentVariables>}
 * 
 * @example
 * ```typescript
 * // Aplicar defaults em runtime
 * import { defaultEnvironment } from './config/env/env.config';
 * 
 * const env = {
 *   ...defaultEnvironment,
 *   ...process.env
 * };
 * ```
 */
export const defaultEnvironment: Partial<EnvironmentVariables> = {
  /** Região padrão AWS (Leste dos EUA) */
  AWS_REGION: 'us-east-1',
  /** Nome padrão da tabela DynamoDB */
  DYNAMODB_TABLE: 'portfolio-backend-table',
  /** Expiração padrão de tokens (1 dia) */
  JWT_EXPIRES_IN: '1d',
  /** Ambiente padrão (desenvolvimento) */
  NODE_ENV: 'development',
  /** Porta padrão do servidor */
  PORT: 3000,
  /** Memória padrão para Lambda */
  LAMBDA_MEMORY_SIZE: 256,
  /** Timeout padrão para Lambda */
  LAMBDA_TIMEOUT: 30,
};
