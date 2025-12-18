/**
 * @fileoverview Configurações do DynamoDB
 * 
 * Módulo responsável por gerenciar todas as configurações relacionadas
 * ao serviço DynamoDB da AWS para persistência de dados serverless.
 * 
 * @module config/dynamodb/dynamodb.config
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

/**
 * Interface de configuração do DynamoDB.
 * 
 * Define o contrato das configurações necessárias para
 * estabelecer conexão com o DynamoDB, seja em ambiente
 * local ou na AWS.
 * 
 * @interface DynamoDBConfig
 * 
 * @example
 * ```typescript
 * // Configuração para desenvolvimento local
 * const localConfig: DynamoDBConfig = {
 *   tableName: 'portfolio-backend-table',
 *   region: 'us-east-1',
 *   endpoint: 'http://localhost:8000',
 *   credentials: {
 *     accessKeyId: 'dummy',
 *     secretAccessKey: 'dummy'
 *   }
 * };
 * 
 * // Configuração para produção AWS
 * const prodConfig: DynamoDBConfig = {
 *   tableName: 'portfolio-backend-table',
 *   region: 'us-east-1'
 * };
 * ```
 */
export interface DynamoDBConfig {
  /** Nome da tabela DynamoDB principal */
  tableName: string;
  /** Região AWS onde a tabela está hospedada */
  region: string;
  /** Endpoint customizado (usado para DynamoDB Local) */
  endpoint?: string;
  /** Credenciais AWS (necessárias apenas para ambiente local) */
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

/**
 * Obtém as configurações do DynamoDB a partir das variáveis de ambiente.
 * 
 * Esta função centraliza a leitura das configurações do DynamoDB,
 * aplicando valores padrão e tratando casos específicos como
 * ambiente de desenvolvimento local.
 * 
 * @function getDynamoDBConfig
 * @returns {DynamoDBConfig} Configuração validada do DynamoDB
 * 
 * @example
 * ```typescript
 * // Obter configuração para uso
 * const config = getDynamoDBConfig();
 * console.log(`Tabela: ${config.tableName}`);
 * console.log(`Região: ${config.region}`);
 * 
 * if (config.endpoint) {
 *   console.log('Usando DynamoDB Local');
 * }
 * ```
 */
export function getDynamoDBConfig(): DynamoDBConfig {
  const region = process.env.AWS_REGION || 'us-east-1';
  const tableName = process.env.DYNAMODB_TABLE || 'portfolio-backend-table';
  const endpoint = process.env.DYNAMODB_LOCAL_ENDPOINT;

  const config: DynamoDBConfig = {
    tableName,
    region,
  };

  // Configuração para ambiente local (DynamoDB Local)
  if (process.env.NODE_ENV === 'development' && endpoint) {
    config.endpoint = endpoint;
    config.credentials = {
      accessKeyId: 'dummy',
      secretAccessKey: 'dummy',
    };
  }

  return config;
}

/**
 * Cria uma instância do cliente DynamoDB com configurações apropriadas.
 * 
 * Utiliza as configurações obtidas via `getDynamoDBConfig()` para
 * criar um cliente pronto para uso, seja ele local ou na AWS.
 * 
 * @function createDynamoDBClient
 * @returns {DynamoDBClient} Cliente configurado do DynamoDB
 * 
 * @example
 * ```typescript
 * // Criar cliente para operações no banco
 * const client = createDynamoDBClient();
 * 
 * // Usar com comandos AWS SDK
 * const command = new GetItemCommand({
 *   TableName: 'portfolio-backend-table',
 *   Key: { id: { S: '123' } }
 * });
 * 
 * const response = await client.send(command);
 * ```
 */
export function createDynamoDBClient(): DynamoDBClient {
  const config = getDynamoDBConfig();

  return new DynamoDBClient({
    region: config.region,
    endpoint: config.endpoint,
    credentials: config.credentials,
  });
}

/**
 * Configurações de performance e custos do DynamoDB.
 * 
 * Define estratégias de otimização e controle de custos
 * para operações no DynamoDB, seguindo as melhores práticas
 * para arquiteturas serverless.
 * 
 * @const dynamodbSettings
 * @type {object}
 */
export const dynamodbSettings = {
  /**
   * Modo de capacidade provisionada vs on-demand.
   * 
   * - PROVISIONED: Configura RU (Read Units) e WU (Write Units) manualmente
   * - PAY_PER_REQUEST: Paga pelo consumo real (recomendado para serverless)
   * 
   * @type {'PROVISIONED' | 'PAY_PER_REQUEST'}
   */
  capacityMode: 'PAY_PER_REQUEST' as const,

  /**
   * Configurações de TTL (Time To Live) para expiração automática.
   * 
   * Permite que itens expirem automaticamente após um período,
   * ideal para dados temporários como sessões e tokens.
   */
  ttlSettings: {
    /** Configuração para sessões de usuário */
    sessions: {
      enabled: true,
      attributeName: 'expiresAt',
      ttlInSeconds: 24 * 60 * 60, // 24 horas
    },
    /** Configuração para refresh tokens */
    refreshTokens: {
      enabled: true,
      attributeName: 'expiresAt',
      ttlInSeconds: 7 * 24 * 60 * 60, // 7 dias
    },
  },

  /**
   * Configurações de backup e recuperação.
   * 
   * Define políticas de backup para proteção contra perda de dados.
   */
  backupSettings: {
    pointInTimeRecovery: true,
    backupRetentionPeriod: 35, // dias
  },

  /**
   * Configurações de streams para eventos em tempo real.
   * 
   * Habilita captura de mudanças para triggers, analytics e
   * sincronização com outros serviços.
   */
  streamSettings: {
    enabled: true,
    streamViewType: 'NEW_AND_OLD_IMAGES' as const,
  },
};

/**
 * Nomes das GSIs (Global Secondary Indexes).
 * 
 * Define identificadores para os índices secundários globais
 * utilizados no padrão Single Table Design.
 * 
 * @const gsiNames
 * @readonly
 */
export const gsiNames = {
  GSI1: 'GSI1',
  GSI2: 'GSI2',
} as const;

/**
 * Configurações do padrão Single Table Design.
 * 
 * Implementa estratégia para organizar múltiplas entidades
 * em uma única tabela DynamoDB, otimizando custos e performance.
 * 
 * @const singleTableDesign
 * @type {object}
 */
export const singleTableDesign = {
  /**
   * Prefixos para chaves primárias (PK) e secundárias (SK).
   * 
   * Cada tipo de entidade utiliza um prefixo único para
   * evitar colisões e permitir consultas eficientes.
   */
  prefixes: {
    user: 'USER#',
    post: 'POST#',
    comment: 'COMMENT#',
    like: 'LIKE#',
    category: 'CATEGORY#',
    bookmark: 'BOOKMARK#',
    notification: 'NOTIFICATION#',
  },

  /**
   * GSI1: Para consultas por tipo de entidade.
   * 
   * Estrutura:
   * - PK: ENTITY_TYPE#ID
   * - SK: METADATA
   * 
   * Uso: Listar todos os itens de um tipo específico
   */
  gsi1: {
    name: gsiNames.GSI1,
    description: 'Consultas por tipo de entidade',
  },

  /**
   * GSI2: Para consultas por relacionamentos.
   * 
   * Estrutura:
   * - PK: RELATIONSHIP#ID
   * - SK: RELATED_ENTITY#ID
   * 
   * Uso: Buscar itens relacionados (posts de um usuário, etc.)
   */
  gsi2: {
    name: gsiNames.GSI2,
    description: 'Consultas por relacionamentos',
  },
};
