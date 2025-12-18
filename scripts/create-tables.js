const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy',
  },
});

async function createUsersTable() {
  const command = new CreateTableCommand({
    TableName: 'blog-users',
    KeySchema: [
      { AttributeName: 'cognitoSub', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'cognitoSub', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  });

  try {
    console.log('Criando tabela blog-users...');
    const result = await client.send(command);
    console.log('✅ Tabela criada:', result.TableDescription?.TableName);
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('✅ Tabela blog-users já existe');
    } else {
      console.error('❌ Erro:', error.message);
    }
  }
}

createUsersTable().then(() => {
  console.log('\n🎉 Processo concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Falha:', error);
  process.exit(1);
});
