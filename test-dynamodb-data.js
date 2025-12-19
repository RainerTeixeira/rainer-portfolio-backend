/**
 * Test script to verify DynamoDB data handling
 * Run with: node test-dynamodb-data.js
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

async function testTables() {
  const tables = [
    'portfolio-backend-table-users',
    'portfolio-backend-table-categories', 
    'portfolio-backend-table-posts',
    'portfolio-backend-table-comments',
    'portfolio-backend-table-likes',
    'portfolio-backend-table-bookmarks',
    'portfolio-backend-table-notifications'
  ];

  for (const tableName of tables) {
    try {
      console.log(`\n=== Testing ${tableName} ===`);
      
      const result = await docClient.send(new ScanCommand({
        TableName: tableName,
        Limit: 3 // Just get first 3 items
      }));

      console.log(`✅ ${tableName}: ${result.Items?.length || 0} items found`);
      
      if (result.Items && result.Items.length > 0) {
        console.log('Sample item structure:');
        const sampleItem = result.Items[0];
        console.log(JSON.stringify(sampleItem, null, 2));
      }
      
    } catch (error) {
      console.log(`❌ ${tableName}: ${error.message}`);
    }
  }
}

async function testUserData() {
  try {
    console.log('\n=== Testing User Data Structure ===');
    
    const result = await docClient.send(new ScanCommand({
      TableName: 'portfolio-backend-table-users',
      Limit: 1
    }));

    if (result.Items && result.Items.length > 0) {
      const user = result.Items[0];
      console.log('User fields present:');
      console.log('- cognitoSub:', !!user.cognitoSub);
      console.log('- fullName:', !!user.fullName);
      console.log('- nickname:', !!user.nickname);
      console.log('- role:', !!user.role);
      console.log('- isActive:', !!user.isActive);
      console.log('- isBanned:', !!user.isBanned);
      console.log('- postsCount:', !!user.postsCount);
      console.log('- commentsCount:', !!user.commentsCount);
      console.log('- createdAt:', !!user.createdAt);
      console.log('- updatedAt:', !!user.updatedAt);
    }
  } catch (error) {
    console.log('❌ User test failed:', error.message);
  }
}

async function testCategoryData() {
  try {
    console.log('\n=== Testing Category Data Structure ===');
    
    const result = await docClient.send(new ScanCommand({
      TableName: 'portfolio-backend-table-categories',
      Limit: 1
    }));

    if (result.Items && result.Items.length > 0) {
      const category = result.Items[0];
      console.log('Category fields present:');
      console.log('- id:', !!category.id);
      console.log('- name:', !!category.name);
      console.log('- slug:', !!category.slug);
      console.log('- description:', !!category.description);
      console.log('- color:', !!category.color);
      console.log('- icon:', !!category.icon);
      console.log('- isActive:', !!category.isActive);
      console.log('- postsCount:', !!category.postsCount);
      console.log('- parentId:', !!category.parentId);
      console.log('- order:', !!category.order);
    }
  } catch (error) {
    console.log('❌ Category test failed:', error.message);
  }
}

async function main() {
  console.log('🔍 Testing DynamoDB Data Structure...\n');
  
  await testTables();
  await testUserData();
  await testCategoryData();
  
  console.log('\n✅ Test completed!');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});