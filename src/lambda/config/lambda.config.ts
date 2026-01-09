/**
 * @fileoverview Configurações específicas para funções Lambda
 * 
 * Centraliza variáveis de ambiente e configurações
 * específicas do ambiente Lambda/Serverless.
 * 
 * @module config/lambda.config
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

/**
 * Configurações do ambiente Lambda
 */
export const LambdaConfig = {
  /**
   * Ambiente de execução
   */
  environment: process.env.NODE_ENV || 'development',

  /**
   * Versão da aplicação
   */
  version: process.env.VERSION || '1.0.0',

  /**
   * Configurações de timeout (em segundos)
   */
  timeout: {
    default: parseInt(process.env.LAMBDA_TIMEOUT || '30'),
    api: parseInt(process.env.API_TIMEOUT || '30'),
    auth: parseInt(process.env.AUTH_TIMEOUT || '15'),
    heavy: parseInt(process.env.HEAVY_TIMEOUT || '300'),
  },

  /**
   * Configurações de memória (em MB)
   */
  memory: {
    default: parseInt(process.env.LAMBDA_MEMORY || '256'),
    api: parseInt(process.env.API_MEMORY || '256'),
    auth: parseInt(process.env.AUTH_MEMORY || '128'),
    heavy: parseInt(process.env.HEAVY_MEMORY || '1024'),
  },

  /**
   * Configurações de logging
   */
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableStackTrace: process.env.ENABLE_STACK_TRACE === 'true',
    enablePerformanceLogs: process.env.ENABLE_PERFORMANCE_LOGS === 'true',
  },

  /**
   * Configurações de CORS
   */
  cors: {
    allowedOrigins: (process.env.CORS_ORIGINS || '*').split(','),
    allowedHeaders: process.env.CORS_HEADERS || 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Database-Provider',
    allowedMethods: process.env.CORS_METHODS || 'GET,POST,PUT,DELETE,OPTIONS',
    maxAge: parseInt(process.env.CORS_MAX_AGE || '86400'),
  },

  /**
   * Configurações de rate limiting
   */
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED === 'true',
    requests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  },

  /**
   * Configurações de cache
   */
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.CACHE_TTL || '300'), // 5 minutos
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '100'),
  },

  /**
   * Configurações de monitoramento
   */
  monitoring: {
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    enableTracing: process.env.ENABLE_TRACING === 'true',
    serviceName: process.env.SERVICE_NAME || 'blog-api-lambda',
  },

  /**
   * Configurações de segurança
   */
  security: {
    enableRequestId: process.env.ENABLE_REQUEST_ID === 'true',
    enableUserAgent: process.env.ENABLE_USER_AGENT === 'true',
    enableIpLogging: process.env.ENABLE_IP_LOGGING === 'true',
  },

  /**
   * Configurações de API Gateway
   */
  apiGateway: {
    stage: process.env.API_GATEWAY_STAGE || 'v1',
    restApiId: process.env.API_GATEWAY_REST_API_ID,
    resourceId: process.env.API_GATEWAY_RESOURCE_ID,
  },

  /**
   * Configurações de Cognito
   */
  cognito: {
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    clientId: process.env.COGNITO_CLIENT_ID,
    region: process.env.AWS_REGION || 'us-east-1',
  },

  /**
   * Configurações de banco de dados
   */
  database: {
    defaultProvider: process.env.DEFAULT_DB_PROVIDER || 'mongodb',
    enableMultiProvider: process.env.ENABLE_MULTI_PROVIDER === 'true',
  },
} as const;

/**
 * Validações de configuração
 */
export function validateConfig(): void {
  const required = [
    'AWS_REGION',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validações específicas
  if (LambdaConfig.timeout.default < 1 || LambdaConfig.timeout.default > 900) {
    throw new Error('Lambda timeout must be between 1 and 900 seconds');
  }

  if (LambdaConfig.memory.default < 128 || LambdaConfig.memory.default > 10240) {
    throw new Error('Lambda memory must be between 128 and 10240 MB');
  }
}

/**
 * Helper para obter configuração com fallback
 */
export function getConfig<T>(key: keyof typeof LambdaConfig, fallback?: T): T {
  return (LambdaConfig[key] as T) || fallback;
}
