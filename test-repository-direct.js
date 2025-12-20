/**
 * Test DynamoDB Repository Direct
 * Test the repository directly to debug the issue
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

class TestDynamoService {
  constructor() {
    this.client = new DynamoDBClient({
      region: 'us-east-1',
      endpoint: 'http://localhost:8000',
      credentials: {
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy'
      }
    });
    this.docClient = DynamoDBDocumentClient.from(this.client);
  }

  async scan(tableName) {
    try {
      console.log(`Scanning table: ${tableName}`);
      const command = new ScanCommand({ TableName: tableName });
      const result = await this.docClient.send(command);
      console.log(`Items found: ${result.Items?.length || 0}`);
      return result.Items || [];
    } catch (error) {
      console.error(`Error scanning ${tableName}:`, error.message);
      return [];
    }
  }
}

class TestPostRepository {
  constructor() {
    this.dynamo = new TestDynamoService();
    this.tableName = 'portfolio-backend-table-posts';
  }

  async findAll(options = {}) {
    try {
      let posts = await this.dynamo.scan(this.tableName);
      console.log(`Raw posts from DynamoDB: ${posts.length}`);

      if (options.status) {
        posts = posts.filter(p => p.status === options.status);
        console.log(`After status filter (${options.status}): ${posts.length}`);
      }

      if (options.limit) {
        posts = posts.slice(0, options.limit);
        console.log(`After limit (${options.limit}): ${posts.length}`);
      }

      return posts;
    } catch (error) {
      console.error('Error in findAll:', error);
      return [];
    }
  }
}

async function testRepository() {
  console.log('🧪 Testing Repository Direct...\n');

  const repo = new TestPostRepository();
  
  // Test without filters
  console.log('1. Testing findAll() without filters:');
  const allPosts = await repo.findAll();
  console.log(`Result: ${allPosts.length} posts\n`);

  // Test with PUBLISHED filter
  console.log('2. Testing findAll() with PUBLISHED filter:');
  const publishedPosts = await repo.findAll({ status: 'PUBLISHED' });
  console.log(`Result: ${publishedPosts.length} posts\n`);

  // Test with limit
  console.log('3. Testing findAll() with limit 5:');
  const limitedPosts = await repo.findAll({ limit: 5 });
  console.log(`Result: ${limitedPosts.length} posts\n`);

  if (allPosts.length > 0) {
    console.log('Sample post:', JSON.stringify(allPosts[0], null, 2));
  }
}

testRepository().catch(console.error);