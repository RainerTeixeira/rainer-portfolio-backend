/**
 * Configurações do AWS Lambda
 * 
 * Este arquivo contém todas as configurações relacionadas
 * ao ambiente de execução serverless Lambda.
 */

/**
 * Interface de configuração do Lambda
 */
export interface LambdaConfig {
  functionName: string;
  memorySize: number;
  timeout: number;
  runtime: string;
  handler: string;
  environment: Record<string, string>;
}

/**
 * Obtém as configurações do Lambda a partir das variáveis de ambiente
 */
export function getLambdaConfig(): LambdaConfig {
  return {
    functionName: process.env.LAMBDA_FUNCTION_NAME || 'portfolio-backend',
    memorySize: parseInt(process.env.LAMBDA_MEMORY_SIZE || '256'),
    timeout: parseInt(process.env.LAMBDA_TIMEOUT || '30'),
    runtime: 'nodejs20.x',
    handler: 'dist/lambda/handlers/api.handler',
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      AWS_REGION: process.env.AWS_REGION || 'us-east-1',
      DYNAMODB_TABLE: process.env.DYNAMODB_TABLE || 'portfolio-backend-table',
      COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID || '',
      COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID || '',
      JWT_SECRET: process.env.JWT_SECRET || 'default-secret',
    },
  };
}

/**
 * Configurações de performance e otimização
 */
export const lambdaSettings = {
  /**
   * Configurações de cold start
   */
  coldStartOptimization: {
    /**
     * Habilita reutilização de instâncias
     */
    enableReuse: true,
    
    /**
     * Timeout para keep-alive da conexão
     */
    keepAliveTimeout: 30 * 1000, // 30 segundos
    
    /**
     * Tempo máximo de inatividade antes de encerrar
     */
    maxIdleTime: 10 * 60 * 1000, // 10 minutos
  },

  /**
   * Configurações de logging
   */
  logging: {
    /**
     * Nível de log (error, warn, info, debug)
     */
    level: process.env.LOG_LEVEL || 'info',
    
    /**
     * Formato dos logs (json, simple)
     */
    format: 'json' as const,
    
    /**
     * Inclui timestamp nos logs
     */
    includeTimestamp: true,
    
    /**
     * Inclui request ID nos logs
     */
    includeRequestId: true,
  },

  /**
   * Configurações de monitoramento
   */
  monitoring: {
    /**
     * Habilita métricas customizadas
     */
    enableCustomMetrics: true,
    
    /**
     * Habilita tracing com X-Ray
     */
    enableXRay: false, // Opcional, requer configuração adicional
    
    /**
     * Habilita logs estruturados
     */
    enableStructuredLogs: true,
  },

  /**
   * Configurações de segurança
   */
  security: {
    /**
     * Habilita rate limiting
     */
    enableRateLimit: true,
    
    /**
     * Limite de requisições por minuto
     */
    rateLimitRpm: 100,
    
    /**
     * Habilita CORS
     */
    enableCors: true,
    
    /**
     * Origins permitidos no CORS
     */
    corsOrigins: [
      'http://localhost:3000',
      'https://seudominio.com',
    ],
  },

  /**
   * Configurações de cache
   */
  cache: {
    /**
     * Habilita cache de respostas
     */
    enableCache: false, // Implementar se necessário
    
    /**
     * TTL do cache em segundos
     */
    cacheTtl: 300, // 5 minutos
  },
};

/**
 * Headers padrão para respostas HTTP
 */
export const defaultHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': lambdaSettings.security.corsOrigins.join(','),
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
};

/**
 * Configurações de Function URLs
 */
export const functionUrlConfig = {
  /**
   * Tipo de autenticação (NONE, AWS_IAM)
   */
  authType: 'NONE' as const,
  
  /**
     * Habilita invocations mode
     */
  invokeMode: 'BUFFERED' as const,
  
  /**
   * Configurações de CORS
   */
  cors: {
    allowCredentials: true,
    allowHeaders: ['*'],
    allowMethods: ['*'],
    allowOrigins: ['*'],
    exposeHeaders: [],
    maxAge: 0,
  },
};
