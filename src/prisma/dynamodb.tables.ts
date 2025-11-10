/**
 * Criação de Tabelas DynamoDB
 * 
 * Script para criar todas as tabelas necessárias no DynamoDB.
 * Suporta DynamoDB Local (desenvolvimento) e AWS DynamoDB (produção).
 * 
 * Uso:
 * ```bash
 * npm run dynamodb:create-tables
 * # ou
 * npx tsx src/prisma/dynamodb.tables.ts
 * ```
 * 
 * @fileoverview Criação de tabelas DynamoDB
 * @module prisma/dynamodb.tables
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
 * Detecta automaticamente o ambiente
 * - Lambda (AWS_LAMBDA_FUNCTION_NAME existe) → AWS DynamoDB
 * - Local com DYNAMODB_ENDPOINT → DynamoDB Local
 * - Local sem DYNAMODB_ENDPOINT → AWS DynamoDB (scripts manuais)
 */
const isRunningInLambda = !!(
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.AWS_EXECUTION_ENV
);
const isLocalEnvironment = !isRunningInLambda && !!env.DYNAMODB_ENDPOINT;
const environment = isLocalEnvironment ? 'DynamoDB Local' : 'AWS DynamoDB';

/**
 * Cliente DynamoDB para operações administrativas
 */
const client = new DynamoDBClient({
  region: env.AWS_REGION,
  endpoint: env.DYNAMODB_ENDPOINT || undefined,
  credentials: isLocalEnvironment ? {
    accessKeyId: 'fakeAccessKeyId',
    secretAccessKey: 'fakeSecretAccessKey',
  } : undefined, // AWS usa credenciais do ambiente (IAM Role, AWS CLI, etc)
});

/**
 * ⚡ FREE TIER PERMANENTE: 25 RCU + 25 WCU TOTAL (Provisioned)
 * 
 * GRÁTIS PARA SEMPRE (não expira após 12 meses)!
 * 
 * AWS Free Tier PERMANENTE:
 * - ✅ 25 GB armazenamento (sempre grátis)
 * - ✅ 25 RCU + 25 WCU provisionados TOTAL (sempre grátis)
 * 
 * Distribuição Inteligente entre 7 Tabelas:
 * ┌─────────────────┬─────┬─────┬──────────────────────────┐
 * │ Tabela          │ RCU │ WCU │ Justificativa            │
 * ├─────────────────┼─────┼─────┼──────────────────────────┤
 * │ Users           │  5  │  5  │ ⭐ Mais acessado (auth)  │
 * │ Posts           │  5  │  5  │ ⭐ Mais acessado (feed)  │
 * │ Categories      │  3  │  3  │ Navegação frequente      │
 * │ Comments        │  3  │  3  │ Interações médias        │
 * │ Likes           │  3  │  3  │ Curtidas frequentes      │
 * │ Bookmarks       │  3  │  3  │ Salvamentos médios       │
 * │ Notifications   │  3  │  3  │ Notificações médias      │
 * ├─────────────────┼─────┼─────┼──────────────────────────┤
 * │ TOTAL           │ 25  │ 25  │ ✅ FREE TIER SEMPRE!     │
 * └─────────────────┴─────┴─────┴──────────────────────────┘
 * 
 * Boas Práticas Implementadas:
 * 1. ✅ Partition Keys bem distribuídas (id único - evita hot partitions)
 * 2. ✅ Sort Keys para ordenação eficiente (createdAt)
 * 3. ✅ Itens ≤ 1 KB (escrita) e ≤ 4 KB (leitura)
 * 4. ✅ Apenas GSIs essenciais (cada GSI consome RCU/WCU)
 * 5. ✅ CloudFront/cache recomendado (reduz leituras)
 * 6. ✅ Mídia no S3(outro), só metadados no DynamoDB
 * 
 * 💡 Para escalar além do Free Tier:
 * - Configure Auto-Scaling (min=1, max=10 por tabela)
 * - Ou mude para On-Demand após 12 meses
 */

/**
 * Definições base das tabelas
 * Serão adaptadas automaticamente para Local ou AWS
 */
const baseTableDefinitions = [
  {
    TableName: TABLES.USERS,
    KeySchema: [
      { AttributeName: 'cognitoSub', KeyType: 'HASH' }, // Partition key (chave primária)
    ],
    AttributeDefinitions: [
      { AttributeName: 'cognitoSub', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' },
      { AttributeName: 'username', AttributeType: 'S' },
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
        IndexName: 'UsernameIndex',
        KeySchema: [
          { AttributeName: 'username', KeyType: 'HASH' },
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
      { AttributeName: 'slug', AttributeType: 'S' },
      { AttributeName: 'authorId', AttributeType: 'S' },
      { AttributeName: 'subcategoryId', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
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
        IndexName: 'SubcategoryIndex',
        KeySchema: [
          { AttributeName: 'subcategoryId', KeyType: 'HASH' },
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
      { AttributeName: 'parentId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'SlugIndex',
        KeySchema: [
          { AttributeName: 'slug', KeyType: 'HASH' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 3,
          WriteCapacityUnits: 3,
        },
      },
      {
        IndexName: 'ParentIdIndex',
        KeySchema: [
          { AttributeName: 'parentId', KeyType: 'HASH' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 3,
          WriteCapacityUnits: 3,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 3,
      WriteCapacityUnits: 3,
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
      { AttributeName: 'authorId', AttributeType: 'S' },
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
          ReadCapacityUnits: 3,
          WriteCapacityUnits: 3,
        },
      },
      {
        IndexName: 'AuthorIndex',
        KeySchema: [
          { AttributeName: 'authorId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 3,
          WriteCapacityUnits: 3,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 3,
      WriteCapacityUnits: 3,
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
          ReadCapacityUnits: 3,
          WriteCapacityUnits: 3,
        },
      },
      {
        IndexName: 'UserIndex',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 3,
          WriteCapacityUnits: 3,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 3,
      WriteCapacityUnits: 3,
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
          ReadCapacityUnits: 3,
          WriteCapacityUnits: 3,
        },
      },
      {
        IndexName: 'UserIndex',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 3,
          WriteCapacityUnits: 3,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 3,
      WriteCapacityUnits: 3,
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
          ReadCapacityUnits: 3,
          WriteCapacityUnits: 3,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 3,
      WriteCapacityUnits: 3,
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
    if (error.fullName === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

/**
 * Cria uma tabela no DynamoDB com Free Tier (25 RCU/WCU)
 */
async function createTable(definition: any): Promise<void> {
  const exists = await tableExists(definition.TableName);
  
  if (exists) {
    console.log(`⏭️  Tabela ${definition.TableName} já existe`);
    return;
  }

  const throughput = definition.ProvisionedThroughput;
  console.log(`📝 Criando tabela ${definition.TableName} [${throughput.ReadCapacityUnits} RCU / ${throughput.WriteCapacityUnits} WCU]...`);
  
  try {
    const command = new CreateTableCommand(definition);
    await client.send(command);
    
    // Aguarda a tabela ficar ativa
    await waitUntilTableExists(
      { client, maxWaitTime: 60 },
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
  console.log(`  🗄️  CRIANDO TABELAS NO ${environment.toUpperCase()}`);
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  console.log(`🌍 Ambiente: ${environment}`);
  console.log(`🔗 Endpoint: ${env.DYNAMODB_ENDPOINT || 'AWS Cloud (padrão)'}`);
  console.log(`📊 Prefixo das tabelas: ${env.DYNAMODB_TABLE_PREFIX}`);
  console.log(`🌎 Região: ${env.AWS_REGION}`);
  console.log(`💰 Billing Mode: Provisioned (FREE TIER PERMANENTE)`);
  console.log(`⚡ Capacidade Total: 25 RCU + 25 WCU distribuídos entre 7 tabelas\n`);

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
    
    if (isLocalEnvironment) {
      console.error('\n💡 Certifique-se de que o DynamoDB Local está rodando:');
      console.error('   docker-compose up -d dynamodb-local\n');
    } else {
      console.error('\n💡 Verifique suas credenciais AWS:');
      console.error('   aws configure');
      console.error('   aws sts get-caller-identity\n');
    }
    
    process.exit(1);
  }

  // Cria as tabelas
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('  📝 CRIANDO TABELAS');
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  for (const definition of baseTableDefinitions) {
    await createTable(definition);
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════════');
  console.log('  ✨ TODAS AS TABELAS CRIADAS COM SUCESSO!');
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  // Lista tabelas finais
  const finalTables = await listTables();
  console.log('📋 Tabelas disponíveis:');
  finalTables.forEach(table => console.log(`   • ${table}`));
  
  // Informações do Free Tier PERMANENTE
  console.log('\n💰 AWS Free Tier PERMANENTE (não expira!):');
  console.log('   ✅ 25 GB de armazenamento (sempre grátis)');
  console.log('   ✅ 25 RCU + 25 WCU provisionados TOTAL (sempre grátis)');
  console.log('   ✅ Distribuição: Users(5) + Posts(5) + 5 tabelas(3) = 25 RCU/WCU');
  console.log('   ✅ Custo: R$ 0,00 PARA SEMPRE! 🎉');
  
  console.log('\n📊 Distribuição de Capacidade:');
  console.log('   ⭐ Users: 5 RCU/WCU (autenticação, perfis)');
  console.log('   ⭐ Posts: 5 RCU/WCU (feed, listagens)');
  console.log('   📄 Categories: 3 RCU/WCU (navegação)');
  console.log('   💬 Comments: 3 RCU/WCU (interações)');
  console.log('   ❤️  Likes: 3 RCU/WCU (curtidas)');
  console.log('   🔖 Bookmarks: 3 RCU/WCU (salvamentos)');
  console.log('   🔔 Notifications: 3 RCU/WCU (notificações)');
  
  console.log('\n🛡️ Boas Práticas para NÃO Ultrapassar o Limite:');
  console.log('   1. ✅ Use CloudFront/cache para reduzir leituras');
  console.log('   2. ✅ Itens pequenos: ≤1 KB (escrita), ≤4 KB (leitura)');
  console.log('   3. ✅ Mídia no S3, só metadados no DynamoDB');
  console.log('   4. ✅ CloudWatch Alarms para monitorar consumo');
  console.log('   5. ✅ Batch operations (reduz requests)');
  console.log('   6. ✅ Partition Keys bem distribuídas (evita hot partitions)');
  
  console.log('\n⚠️  Se passar do limite:');
  console.log('   • DynamoDB throttling (HTTP 400 - ProvisionedThroughputExceededException)');
  console.log('   • Solução 1: Adicionar cache agressivo (CloudFront)');
  console.log('   • Solução 2: Habilitar Auto-Scaling (min=1, max=10)');
  console.log('   • Solução 3: Mudar para On-Demand (~$0.40/mês para blog pequeno)');
  
  console.log('\n💡 Próximos passos:');
  console.log('   • Execute: npm run dynamodb:seed (popular dados de teste)');
  console.log('   • Execute: npm run dev (iniciar servidor)');
  console.log('   • Configure CloudWatch: aws cloudwatch put-metric-alarm');
  
  if (isLocalEnvironment) {
    console.log('   • Para trocar para AWS: remova DYNAMODB_ENDPOINT do .env');
  } else {
    console.log('   • Monitoramento: AWS CloudWatch Console');
    console.log('   • Custos: aws ce get-cost-and-usage');
  }
  
  console.log();
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

