/**
 * Direct DynamoDB Test
 * Tests DynamoDB connection and data retrieval directly
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

async function testDynamoDBDirect() {
  console.log('🧪 Testing DynamoDB Direct Connection...\n');

  try {
    // Create DynamoDB client
    const client = new DynamoDBClient({
      region: 'us-east-1',
      endpoint: 'http://localhost:8000',
      credentials: {
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy'
      }
    });

    const docClient = DynamoDBDocumentClient.from(client);

    // Test posts table
    console.log('📝 Scanning posts table...');
    const postsCommand = new ScanCommand({
      TableName: 'portfolio-backend-table-posts'
    });
    
    const postsResult = await docClient.send(postsCommand);
    console.log(`Posts found: ${postsResult.Items?.length || 0}`);
    
    if (postsResult.Items && postsResult.Items.length > 0) {
      console.log('First post:', JSON.stringify(postsResult.Items[0], null, 2));
    }

    // Test categories table
    console.log('\n🏷️ Scanning categories table...');
    const categoriesCommand = new ScanCommand({
      TableName: 'portfolio-backend-table-categories'
    });
    
    const categoriesResult = await docClient.send(categoriesCommand);
    console.log(`Categories found: ${categoriesResult.Items?.length || 0}`);
    
    if (categoriesResult.Items && categoriesResult.Items.length > 0) {
      console.log('First category:', JSON.stringify(categoriesResult.Items[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Direct DynamoDB test failed:', error.message);
  }
}

testDynamoDBDirect();