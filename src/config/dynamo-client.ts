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
 * Cliente DynamoDB básico (low-level)
 * 
 * Este é o cliente base que se conecta ao DynamoDB. Ele lida com:
 * - **Região AWS**: Define onde os dados estão hospedados (ex: us-east-1)
 * - **Endpoint**: URL do serviço DynamoDB
 *   - Produção: undefined (usa AWS padrão)
 *   - Local: http://localhost:8000 (DynamoDB Local)
 * - **Credenciais**: Chaves de acesso AWS (obrigatórias em dev, automáticas em Lambda)
 * 
 * @private - Não use diretamente, use o `dynamodb` exportado abaixo
 */
const client = new DynamoDBClient({
  region: env.AWS_REGION,
  endpoint: env.DYNAMODB_ENDPOINT, // undefined em produção, http://localhost:8000 em dev
  credentials: env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
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

