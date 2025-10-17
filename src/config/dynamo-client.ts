/**
 * Cliente DynamoDB
 * 
 * Este módulo configura e exporta o cliente DynamoDB usando AWS SDK v3.
 * 
 * **Funcionamento:**
 * - Em produção (AWS Lambda): Conecta automaticamente ao DynamoDB da AWS
 * - Em desenvolvimento local: Conecta ao DynamoDB Local (porta 8000)
 * 
 * **Propósito:**
 * Centralizar a configuração do DynamoDB para ser reutilizada em todos os módulos
 * que precisam acessar dados no banco NoSQL (posts, comentários, likes, etc).
 * 
 * @module config/dynamo-client
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { env, TABLES } from './env.js';

/**
 * Detecta se está rodando na AWS Lambda
 * Lambda define automaticamente estas variáveis de ambiente
 */
const isRunningInLambda = !!(
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.AWS_EXECUTION_ENV ||
  process.env.LAMBDA_TASK_ROOT
);

/**
 * Cliente DynamoDB básico (low-level)
 * 
 * Detecção Automática de Ambiente:
 * - **AWS Lambda**: Detecta via AWS_LAMBDA_FUNCTION_NAME → usa DynamoDB AWS
 * - **Local com DYNAMODB_ENDPOINT**: usa DynamoDB Local
 * - **Local sem DYNAMODB_ENDPOINT**: não conecta DynamoDB (usa Prisma)
 * 
 * ✅ Vantagem: NÃO precisa trocar .env ao fazer deploy!
 * 
 * @private - Não use diretamente, use o `dynamodb` exportado abaixo
 */
const client = new DynamoDBClient({
  region: env.AWS_REGION,
  // Se está na Lambda → undefined (AWS)
  // Se está local → usa DYNAMODB_ENDPOINT se definido
  endpoint: isRunningInLambda ? undefined : env.DYNAMODB_ENDPOINT,
  // Lambda usa IAM Role automaticamente
  credentials: isRunningInLambda ? undefined : (
    env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY ? {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    } : undefined
  ),
});

/**
 * Document Client - Cliente principal para trabalhar com DynamoDB
 * 
 * **O que faz:**
 * Converte automaticamente objetos JavaScript para o formato DynamoDB e vice-versa.
 * Você trabalha com objetos normais, ele cuida da tradução.
 * 
 * **Por que usar:**
 * - Mais simples: `{ nome: "João" }` ao invés de `{ nome: { S: "João" } }`
 * - Menos erros: Conversão automática de tipos
 * - Mais rápido de desenvolver
 * 
 * **Como usar:**
 * 1. Importe o cliente e os comandos
 * 2. Crie um comando (Put, Get, Query, Update, Delete)
 * 3. Execute com `.send()`
 * 
 * @example
 * // Salvar um novo usuário
 * import { dynamodb, PutCommand, TABLES } from './config/dynamo-client';
 * 
 * await dynamodb.send(new PutCommand({
 *   TableName: TABLES.USERS,
 *   Item: { id: '123', nome: 'João', email: 'joao@email.com' }
 * }));
 * 
 * @example
 * // Buscar um usuário por ID
 * import { dynamodb, GetCommand, TABLES } from './config/dynamo-client';
 * 
 * const result = await dynamodb.send(new GetCommand({
 *   TableName: TABLES.USERS,
 *   Key: { id: '123' }
 * }));
 * console.log(result.Item); // { id: '123', nome: 'João', ... }
 * 
 * @example
 * // Listar posts de um usuário
 * import { dynamodb, QueryCommand, TABLES } from './config/dynamo-client';
 * 
 * const result = await dynamodb.send(new QueryCommand({
 *   TableName: TABLES.POSTS,
 *   KeyConditionExpression: 'userId = :userId',
 *   ExpressionAttributeValues: { ':userId': '123' }
 * }));
 * console.log(result.Items); // Array de posts
 */
export const dynamodb = DynamoDBDocumentClient.from(client);

/**
 * Comandos DynamoDB
 * 
 * Estes são os comandos disponíveis para interagir com o DynamoDB:
 * 
 * - **PutCommand**: Criar ou substituir um item completo
 * - **GetCommand**: Buscar um item pela chave primária (id)
 * - **QueryCommand**: Buscar múltiplos itens (ex: todos posts de um usuário)
 * - **UpdateCommand**: Atualizar campos específicos de um item
 * - **DeleteCommand**: Remover um item
 * 
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/}
 */
export { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand };

/**
 * Nomes das Tabelas DynamoDB
 * 
 * Constantes com os nomes das tabelas para evitar erros de digitação.
 * 
 * **Tabelas disponíveis:**
 * - TABLES.USERS - Usuários do sistema
 * - TABLES.POSTS - Posts/artigos do blog
 * - TABLES.COMMENTS - Comentários nos posts
 * - TABLES.LIKES - Curtidas em posts
 * - TABLES.BOOKMARKS - Marcadores/favoritos
 * - TABLES.NOTIFICATIONS - Notificações dos usuários
 * - TABLES.CATEGORIES - Categorias de posts
 * 
 * @example
 * // Sempre use TABLES ao invés de strings hardcoded
 * import { TABLES } from './config/dynamo-client';
 * 
 * // ✅ Correto
 * TableName: TABLES.USERS
 * 
 * // ❌ Evite
 * TableName: 'users'
 */
export { TABLES };

