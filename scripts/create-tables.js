import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { CreateTableCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  region: 'localhost',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy'
  }
});

const tables = [
  {
    TableName: 'rainer-portfolio-backend-dev-users',
    KeySchema: [{ AttributeName: 'cognitoSub', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'cognitoSub', AttributeType: 'S' }],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: 'rainer-portfolio-backend-dev-posts',
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: 'rainer-portfolio-backend-dev-categories',
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: 'rainer-portfolio-backend-dev-comments',
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: 'rainer-portfolio-backend-dev-likes',
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: 'rainer-portfolio-backend-dev-bookmarks',
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    BillingMode: 'PAY_PER_REQUEST'
  }
];

async function createTables() {
  console.log('Creating DynamoDB tables...');
  
  for (const table of tables) {
    try {
      await client.send(new CreateTableCommand(table));
      console.log(Created table: );
    } catch (error) {
      if (error.name === 'ResourceInUseException') {
        console.log(Table already exists: );
      } else {
        console.error(Error creating table :, error);
      }
    }
  }
  
  console.log('All tables created!');
}

createTables().catch(console.error);
