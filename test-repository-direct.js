/**
 * Teste direto dos repositórios DynamoDB
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Configure DynamoDB client for local development
const client = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy',
  },
});

const docClient = DynamoDBDocumentClient.from(client);

async function testDirectScan() {
  console.log('🔍 Testando scan direto no DynamoDB...\n');

  try {
    // Test users table
    const usersResult = await docClient.send(new ScanCommand({
      TableName: 'portfolio-backend-table-users'
    }));
    
    console.log('👥 Usuários encontrados:', usersResult.Items?.length || 0);
    if (usersResult.Items && usersResult.Items.length > 0) {
      console.log('Primeiro usuário:', JSON.stringify(usersResult.Items[0], null, 2));
    }

    // Test categories table
    const categoriesResult = await docClient.send(new ScanCommand({
      TableName: 'portfolio-backend-table-categories'
    }));
    
    console.log('\n🏷️ Categorias encontradas:', categoriesResult.Items?.length || 0);
    if (categoriesResult.Items && categoriesResult.Items.length > 0) {
      console.log('Primeira categoria:', JSON.stringify(categoriesResult.Items[0], null, 2));
    }

    // Test posts table
    const postsResult = await docClient.send(new ScanCommand({
      TableName: 'portfolio-backend-table-posts'
    }));
    
    console.log('\n📝 Posts encontrados:', postsResult.Items?.length || 0);
    if (postsResult.Items && postsResult.Items.length > 0) {
      console.log('Primeiro post:', JSON.stringify(postsResult.Items[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Erro no teste direto:', error.message);
  }
}

testDirectScan();