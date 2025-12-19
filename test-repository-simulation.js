/**
 * Teste direto do repositório DynamoDB
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Simular o DynamoDBService
class TestDynamoDBService {
  constructor() {
    this.client = new DynamoDBClient({
      region: 'us-east-1',
      endpoint: 'http://localhost:8000',
      credentials: {
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy',
      },
    });
    this.docClient = DynamoDBDocumentClient.from(this.client);
  }

  async scan(options = {}, tableName) {
    const command = new ScanCommand({
      TableName: tableName,
      ...options,
    });
    const result = await this.docClient.send(command);
    return result.Items || [];
  }
}

// Simular o DynamoUserRepository
class TestDynamoUserRepository {
  constructor(dynamo) {
    this.dynamo = dynamo;
    this.tableName = 'portfolio-backend-table-users';
  }

  async findAll() {
    try {
      console.log('TestDynamoUserRepository.findAll - scanning table:', this.tableName);
      const items = await this.dynamo.scan({}, this.tableName);
      console.log('TestDynamoUserRepository.findAll - items found:', items.length);
      
      const users = items.map(item => {
        const user = item;
        user.id = user.cognitoSub;
        return user;
      });
      
      console.log('TestDynamoUserRepository.findAll - processed users:', users.length);
      return users;
    } catch (error) {
      console.error('Error scanning users:', error);
      return [];
    }
  }
}

async function testRepository() {
  console.log('🔍 Testando repositório DynamoDB...\n');

  const dynamoService = new TestDynamoDBService();
  const userRepository = new TestDynamoUserRepository(dynamoService);

  const users = await userRepository.findAll();
  
  console.log('\n📊 Resultado:');
  console.log('- Usuários encontrados:', users.length);
  
  if (users.length > 0) {
    console.log('- Primeiro usuário:');
    console.log('  - cognitoSub:', users[0].cognitoSub);
    console.log('  - fullName:', users[0].fullName);
    console.log('  - role:', users[0].role);
    console.log('  - id (gerado):', users[0].id);
  }
}

testRepository();