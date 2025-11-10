/**
 * Configuração e Validação de Variáveis de Ambiente
 * 
 * Este módulo centraliza toda a configuração da aplicação através de
 * variáveis de ambiente, com validação rigorosa usando Zod.
 * 
 * Arquitetura de Banco de Dados:
 * - DESENVOLVIMENTO: Prisma + MongoDB (rápido, produtivo, schema visual)
 * - PRODUÇÃO/LAMBDA: DynamoDB (serverless, escalável, pay-per-request)
 * - Autenticação: AWS Cognito (credenciais) + MongoDB/DynamoDB (perfil)
 * 
 * Funcionalidades:
 * - Validação de variáveis de ambiente em runtime
 * - Type-safety com TypeScript
 * - Valores padrão inteligentes por ambiente
 * - Detecção de configurações inválidas
 * - Suporte para múltiplos provedores de banco
 * 
 * Benefícios:
 * - Falha rápida: Erros de configuração detectados na inicialização
 * - Autocomplete: IDE sugere variáveis disponíveis
 * - Type-safe: TypeScript garante uso correto
 * - Documentado: Schema Zod documenta campos esperados
 * 
 * Arquivo .env (desenvolvimento - Prisma + MongoDB):
 * ```
 * NODE_ENV=development
 * PORT=4000
 * HOST=0.0.0.0
 * LOG_LEVEL=info
 * CORS_ORIGIN=*
 * 
 * # Database - MongoDB (Desenvolvimento)
 * DATABASE_PROVIDER=PRISMA
 * DATABASE_URL="mongodb://localhost:27017/blog?replicaSet=rs0&directConnection=true"
 * 
 * # AWS Cognito (Autenticação)
 * COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
 * COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
 * COGNITO_REGION=us-east-1
 * ```
 * 
 * Arquivo .env (produção - DynamoDB):
 * ```
 * NODE_ENV=production
 * PORT=4000
 * 
 * # Database - DynamoDB (Produção/Lambda)
 * DATABASE_PROVIDER=DYNAMODB
 * AWS_REGION=us-east-1
 * DYNAMODB_TABLE_PREFIX=blog-prod
 * 
 * # AWS Cognito
 * COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
 * COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
 * COGNITO_REGION=us-east-1
 * ```
 * 
 * @fileoverview Configuração e validação de variáveis de ambiente
 * @module env
 * @version 2.0.0
 * @since 1.0.0
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// ═══════════════════════════════════════════════════════════════════════════
// CARREGAMENTO DE ARQUIVO .env
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Carrega variáveis do arquivo .env para process.env
 * 
 * Em desenvolvimento:
 * - Lê arquivo .env na raiz do projeto
 * - Variáveis não sobrescrevem process.env existentes
 * 
 * Em produção:
 * - Variáveis geralmente vêm de AWS Systems Manager, secrets, etc
 * - Arquivo .env não é necessário
 */
dotenv.config();

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DE VALIDAÇÃO
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Schema Zod para validação de variáveis de ambiente
 * 
 * Exportado para permitir:
 * - Testes unitários do schema
 * - Validação customizada em outros módulos
 * - Reutilização do schema
 * 
 * Cada campo define:
 * - Tipo esperado (string, number, enum)
 * - Validações (URL, coerção numérica)
 * - Valor padrão (quando aplicável)
 * - Opcionalidade (required vs optional)
 * 
 * Campos:
 * 
 * NODE_ENV:
 * - Ambiente de execução
 * - Valores: 'development' | 'production' | 'test'
 * - Padrão: 'development'
 * 
 * PORT:
 * - Porta HTTP do servidor
 * - Tipo: number (coerção automática de string)
 * - Padrão: 4000
 * - Range típico: 4000-9000 (desenvolvimento), 80/443 (produção)
 * 
 * HOST:
 * - Host de bind do servidor
 * - Padrão: '0.0.0.0' (todas as interfaces)
 * - Alternativas: 'localhost' (apenas local), IP específico
 * 
 * LOG_LEVEL:
 * - Nível de logging do Pino
 * - Valores: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'
 * - Padrão: 'info'
 * - Produção recomendado: 'warn' ou 'error'
 * 
 * CORS_ORIGIN:
 * - Origens permitidas para CORS
 * - Padrão: '*' (todas - apenas desenvolvimento)
 * - Produção: Lista de domínios separados por vírgula
 * 
 * AWS_REGION:
 * - Região AWS para serviços
 * - Padrão: 'us-east-1'
 * - Exemplos: 'us-west-2', 'eu-central-1', 'sa-east-1'
 * 
 * AWS_ACCESS_KEY_ID:
 * - Chave de acesso AWS (opcional)
 * - Necessário apenas para desenvolvimento local
 * - Em Lambda, usa IAM Role automaticamente
 * 
 * AWS_SECRET_ACCESS_KEY:
 * - Chave secreta AWS (opcional)
 * - Par da ACCESS_KEY_ID
 * - Nunca commitar no Git
 * 
 * DYNAMODB_ENDPOINT:
 * - URL do DynamoDB (opcional)
 * - Desenvolvimento: 'http://localhost:8000' (DynamoDB Local)
 * - Produção: undefined (usa DynamoDB AWS)
 * - Validação: Deve ser URL válida se fornecido
 * 
 * DYNAMODB_TABLE_PREFIX:
 * - Prefixo para nomes de tabelas
 * - Padrão: 'blog'
 * - Permite múltiplos ambientes na mesma conta AWS
 * - Exemplo: 'blog-dev', 'blog-staging', 'blog-prod'
 * 
 * DATABASE_URL:
 * - String de conexão do MongoDB (Prisma ORM)
 * - Formato: mongodb://host:port/database?options
 * - Desenvolvimento: mongodb://localhost:27017/blog?replicaSet=rs0&directConnection=true
 * - Produção Atlas: mongodb+srv://user:pass@cluster.mongodb.net/blog
 * - Obrigatório quando DATABASE_PROVIDER=PRISMA
 * - Nota: Prisma 6+ requer MongoDB em modo Replica Set
 * 
 * DATABASE_PROVIDER:
 * - Provider de banco de dados a usar
 * - Valores: 'PRISMA' | 'DYNAMODB'
 * - Padrão: 'PRISMA' (recomendado para desenvolvimento)
 * - PRISMA: Prisma ORM + MongoDB
 *   • Desenvolvimento rápido e produtivo
 *   • Prisma Studio (GUI visual)
 *   • Type-safe queries
 *   • Migrations automáticas
 *   • Ideal para: desenvolvimento, testes, staging
 * - DYNAMODB: AWS DynamoDB
 *   • Serverless, escalável, pay-per-request
 *   • Sem gerenciamento de servidor
 *   • Alta disponibilidade automática
 *   • Ideal para: produção AWS Lambda
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGIN: z.string().default('*'),
  
  // Database Configuration
  DATABASE_URL: z.string().optional(), // MongoDB connection string (obrigatório para DATABASE_PROVIDER=PRISMA)
  DATABASE_PROVIDER: z.enum(['PRISMA', 'DYNAMODB']).default('PRISMA'), // PRISMA=MongoDB (dev) | DYNAMODB=AWS (prod)
  
  // AWS Configuration
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  DYNAMODB_ENDPOINT: z.string().url().optional(),
  DYNAMODB_TABLE_PREFIX: z.string().default('blog'),
  
  // AWS Cognito Configuration
  COGNITO_USER_POOL_ID: z.string().optional(),
  COGNITO_CLIENT_ID: z.string().optional(),
  COGNITO_CLIENT_SECRET: z.string().optional(),
  COGNITO_REGION: z.string().optional(),
  COGNITO_ISSUER: z.string().url().optional(),
  COGNITO_DOMAIN: z.string().optional(), // Domínio do Hosted UI (sem protocolo)
  OAUTH_REDIRECT_SIGN_IN: z.string().url().optional(), // URL de callback no frontend
  JWT_SECRET: z.string().optional().default('your-secret-key-change-in-production'),
  
  // OAuth Providers (Google/GitHub via Cognito Hosted UI)
  // Nota: Estes são mantidos para compatibilidade, mas o fluxo OAuth é mediado pelo Cognito
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_REDIRECT_URI: z.string().url().optional(),
  
  // Cloudinary Configuration
  CLOUDINARY_URL: z.string().optional(), // Formato: cloudinary://api_key:api_secret@cloud_name
});

// ═══════════════════════════════════════════════════════════════════════════
// FUNÇÃO DE VALIDAÇÃO (TESTÁVEL)
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Valida variáveis de ambiente contra o schema Zod
 * 
 * Esta função é exportada para permitir testes unitários completos
 * do comportamento de validação e tratamento de erros.
 * 
 * @param {NodeJS.ProcessEnv} processEnv - Objeto de variáveis de ambiente
 * @returns {z.infer<typeof envSchema>} Configuração validada
 * @throws {Error} Se validação falhar
 * 
 * @example
 * // Uso normal (chamado automaticamente no bootstrap)
 * const config = validateEnvironment(process.env);
 * 
 * @example
 * // Teste com env customizado
 * const testConfig = validateEnvironment({
 *   NODE_ENV: 'test',
 *   PORT: '3000',
 *   DATABASE_URL: 'mongodb://localhost:27017/test'
 * });
 */
export function validateEnvironment(processEnv: NodeJS.ProcessEnv) {
  const result = envSchema.safeParse(processEnv);
  
  if (!result.success) {
    console.error('❌ Erro nas variáveis de ambiente:', result.error.format());
    throw new Error('Configuração de ambiente inválida');
  }
  
  return result.data;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTAÇÃO DE CONFIGURAÇÃO VALIDADA
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Objeto de configuração validado e tipado
 * 
 * Uso:
 * - Importar em qualquer módulo: import { env } from './env.js'
 * - Type-safe: TypeScript conhece todos os campos
 * - Autocomplete: IDE sugere campos disponíveis
 * - Garantido: Todos os valores são válidos
 * 
 * @type {Object} Configuração validada da aplicação
 * @property {string} NODE_ENV - Ambiente de execução
 * @property {number} PORT - Porta do servidor
 * @property {string} HOST - Host de bind
 * @property {string} LOG_LEVEL - Nível de logging
 * @property {string} CORS_ORIGIN - Origens CORS permitidas
 * @property {string} AWS_REGION - Região AWS
 * @property {string} [AWS_ACCESS_KEY_ID] - Chave de acesso AWS
 * @property {string} [AWS_SECRET_ACCESS_KEY] - Chave secreta AWS
 * @property {string} [DYNAMODB_ENDPOINT] - URL do DynamoDB Local
 * @property {string} DYNAMODB_TABLE_PREFIX - Prefixo das tabelas
 * 
 * @example
 * import { env } from './env.js';
 * 
 * console.log(`Servidor na porta ${env.PORT}`);
 * console.log(`Ambiente: ${env.NODE_ENV}`);
 */
export const env = validateEnvironment(process.env);

// ═══════════════════════════════════════════════════════════════════════════
// NOMES DE TABELAS DYNAMODB
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Objeto com nomes completos das tabelas DynamoDB
 * 
 * Nomenclatura:
 * - Formato: {PREFIX}-{RESOURCE}
 * - Exemplo: 'blog-users', 'blog-posts'
 * 
 * Benefícios:
 * - Centralizado: Nomes definidos em um único lugar
 * - Consistente: Prefixo aplicado automaticamente
 * - Type-safe: Readonly e const garantem imutabilidade
 * - Multi-ambiente: Prefixo permite ambientes na mesma conta
 * 
 * Uso:
 * ```typescript
 * import { TABLES } from './env.js';
 * 
 * await dynamoDb.send(new PutCommand({
 *   TableName: TABLES.USERS,
 *   Item: user
 * }));
 * ```
 * 
 * Tabelas (7 modelos principais):
 * - USERS: Usuários, autores, perfis
 * - POSTS: Posts/artigos do blog
 * - CATEGORIES: Categorias (hierarquia de 2 níveis)
 * - COMMENTS: Comentários em posts (com threads)
 * - LIKES: Curtidas em posts
 * - BOOKMARKS: Posts salvos pelos usuários
 * - NOTIFICATIONS: Notificações do sistema
 * 
 * Nota: Estas tabelas são usadas apenas quando DATABASE_PROVIDER=DYNAMODB.
 * Em desenvolvimento (DATABASE_PROVIDER=PRISMA), MongoDB é usado via Prisma ORM.
 * 
 * @type {Readonly<Object>} Nomes das tabelas DynamoDB
 * @property {string} USERS - Tabela de usuários
 * @property {string} POSTS - Tabela de posts
 * @property {string} CATEGORIES - Tabela de categorias
 * @property {string} COMMENTS - Tabela de comentários
 * 
 * @example
 * // Com prefixo padrão 'blog'
 * TABLES.USERS      // 'blog-users'
 * TABLES.POSTS      // 'blog-posts'
 * TABLES.CATEGORIES // 'blog-categories'
 * TABLES.COMMENTS   // 'blog-comments'
 * 
 * @example
 * // Com prefixo customizado 'myapp-prod'
 * TABLES.USERS      // 'myapp-prod-users'
 * TABLES.POSTS      // 'myapp-prod-posts'
 */
export const TABLES = {
  USERS: `${env.DYNAMODB_TABLE_PREFIX}-users`,
  POSTS: `${env.DYNAMODB_TABLE_PREFIX}-posts`,
  CATEGORIES: `${env.DYNAMODB_TABLE_PREFIX}-categories`,
  COMMENTS: `${env.DYNAMODB_TABLE_PREFIX}-comments`,
  LIKES: `${env.DYNAMODB_TABLE_PREFIX}-likes`,
  BOOKMARKS: `${env.DYNAMODB_TABLE_PREFIX}-bookmarks`,
  NOTIFICATIONS: `${env.DYNAMODB_TABLE_PREFIX}-notifications`,
} as const;
