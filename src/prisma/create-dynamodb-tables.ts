/**
 * Script para criar tabelas no DynamoDB Local
 * 
 * Este script cria todas as tabelas necessárias para o funcionamento da aplicação
 * no DynamoDB Local. Deve ser executado após iniciar o container do DynamoDB.
 * 
 * Uso:
 *   npm run dynamodb:create-tables
 * 
 * @module scripts/create-dynamodb-tables
 */

import { 
  DynamoDBClient, 
  CreateTableCommand, 
  ListTablesCommand,
  DescribeTableCommand,
  waitUntilTableExists
} from '@aws-sdk/client-dynamodb';
import { env, TABLES } from '../config/env.js';

/**
 * Cliente DynamoDB para operações administrativas
 */
const client = new DynamoDBClient({
  region: env.AWS_REGION,
  endpoint: env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID || 'fakeAccessKeyId',
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY || 'fakeSecretAccessKey',
  },
});

/**
 * Definições das tabelas
 */
const tableDefinitions = [
  {
    TableName: TABLES.USERS,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }, // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' },
      { AttributeName: 'cognitoId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'EmailIndex',
        KeySchema: [
          { AttributeName: 'email', KeyType: 'HASH' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
      {
        IndexName: 'CognitoIdIndex',
        KeySchema: [
          { AttributeName: 'cognitoId', KeyType: 'HASH' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  },
  {
    TableName: TABLES.POSTS,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'authorId', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'AuthorIndex',
        KeySchema: [
          { AttributeName: 'authorId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
      {
        IndexName: 'StatusIndex',
        KeySchema: [
          { AttributeName: 'status', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  },
  {
    TableName: TABLES.CATEGORIES,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'slug', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'SlugIndex',
        KeySchema: [
          { AttributeName: 'slug', KeyType: 'HASH' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  },
  {
    TableName: TABLES.COMMENTS,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'postId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'PostIndex',
        KeySchema: [
          { AttributeName: 'postId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  },
  {
    TableName: TABLES.LIKES,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'postId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'PostIndex',
        KeySchema: [
          { AttributeName: 'postId', KeyType: 'HASH' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
      {
        IndexName: 'UserIndex',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  },
  {
    TableName: TABLES.BOOKMARKS,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'postId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'PostIndex',
        KeySchema: [
          { AttributeName: 'postId', KeyType: 'HASH' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
      {
        IndexName: 'UserIndex',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  },
  {
    TableName: TABLES.NOTIFICATIONS,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'UserIndex',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  },
];

/**
 * Verifica se uma tabela existe
 */
async function tableExists(tableName: string): Promise<boolean> {
  try {
    const command = new DescribeTableCommand({ TableName: tableName });
    await client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

/**
 * Cria uma tabela no DynamoDB
 */
async function createTable(definition: any): Promise<void> {
  const exists = await tableExists(definition.TableName);
  
  if (exists) {
    console.log(`⏭️  Tabela ${definition.TableName} já existe`);
    return;
  }

  console.log(`📝 Criando tabela ${definition.TableName}...`);
  
  try {
    const command = new CreateTableCommand(definition);
    await client.send(command);
    
    // Aguarda a tabela ficar ativa
    await waitUntilTableExists(
      { client, maxWaitTime: 30 },
      { TableName: definition.TableName }
    );
    
    console.log(`✅ Tabela ${definition.TableName} criada com sucesso!`);
  } catch (error: any) {
    console.error(`❌ Erro ao criar tabela ${definition.TableName}:`, error.message);
    throw error;
  }
}

/**
 * Lista todas as tabelas existentes
 */
async function listTables(): Promise<string[]> {
  try {
    const command = new ListTablesCommand({});
    const response = await client.send(command);
    return response.TableNames || [];
  } catch (error: any) {
    console.error('❌ Erro ao listar tabelas:', error.message);
    return [];
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════════════════');
  console.log('  🗄️  CRIANDO TABELAS NO DYNAMODB LOCAL');
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  console.log(`🔗 Conectando em: ${env.DYNAMODB_ENDPOINT || 'DynamoDB AWS'}`);
  console.log(`📊 Prefixo das tabelas: ${env.DYNAMODB_TABLE_PREFIX}`);
  console.log(`🌍 Região: ${env.AWS_REGION}\n`);

  // Verifica conexão
  console.log('🔍 Verificando conexão...');
  try {
    const existingTables = await listTables();
    console.log(`✅ Conexão estabelecida!`);
    if (existingTables.length > 0) {
      console.log(`📋 Tabelas existentes: ${existingTables.join(', ')}\n`);
    } else {
      console.log('📋 Nenhuma tabela existente\n');
    }
  } catch (error: any) {
    console.error('❌ Erro ao conectar com DynamoDB:', error.message);
    console.error('\n💡 Certifique-se de que o DynamoDB Local está rodando:');
    console.error('   docker-compose up -d dynamodb-local\n');
    process.exit(1);
  }

  // Cria as tabelas
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('  📝 CRIANDO TABELAS');
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  for (const definition of tableDefinitions) {
    await createTable(definition);
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════════');
  console.log('  ✨ TODAS AS TABELAS CRIADAS COM SUCESSO!');
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  // Lista tabelas finais
  const finalTables = await listTables();
  console.log('📋 Tabelas disponíveis:');
  finalTables.forEach(table => console.log(`   • ${table}`));
  
  console.log('\n💡 Próximos passos:');
  console.log('   • Execute: npm run dynamodb:seed (popular dados de teste)');
  console.log('   • Execute: npm run dev (iniciar servidor)\n');
}

// Executa o script
main()
  .then(() => {
    console.log('✅ Script concluído com sucesso!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao executar script:', error);
    process.exit(1);
  });

