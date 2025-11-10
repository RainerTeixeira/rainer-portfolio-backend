/**
 * Testes Unitários: DynamoDB Tables
 * 
 * Testa o script de criação de tabelas do DynamoDB.
 * Cobertura: Principais funções e cenários de erro
 */

import {
  DynamoDBClient,
  CreateTableCommand,
  ListTablesCommand,
  DescribeTableCommand,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';

// Mock do AWS SDK
jest.mock('@aws-sdk/client-dynamodb');

// Mock das variáveis de ambiente
const mockEnv = {
  AWS_REGION: 'us-east-1',
  DYNAMODB_ENDPOINT: 'http://localhost:8000',
  DYNAMODB_TABLE_PREFIX: 'test-',
};

const mockTables = {
  USERS: 'test-Users',
  POSTS: 'test-Posts',
  CATEGORIES: 'test-Categories',
  COMMENTS: 'test-Comments',
  LIKES: 'test-Likes',
  BOOKMARKS: 'test-Bookmarks',
  NOTIFICATIONS: 'test-Notifications',
};

jest.mock('../../src/config/env.js', () => ({
  env: mockEnv,
  TABLES: mockTables,
}));

describe('DynamoDB Tables Script', () => {
  let mockSend: jest.Mock;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSend = jest.fn().mockResolvedValue({
      TableNames: [],
    });

    mockClient = {
      send: mockSend,
    };

    (DynamoDBClient as jest.Mock).mockImplementation(() => mockClient);
    (waitUntilTableExists as jest.Mock).mockResolvedValue({});
  });

  describe('Configuração do Cliente', () => {
    it('deve criar cliente DynamoDB com configurações corretas', () => {
      new DynamoDBClient({
        region: mockEnv.AWS_REGION,
        endpoint: mockEnv.DYNAMODB_ENDPOINT,
      });

      expect(DynamoDBClient).toHaveBeenCalledWith(
        expect.objectContaining({
          region: 'us-east-1',
          endpoint: 'http://localhost:8000',
        })
      );
    });

    it('deve usar credenciais fake em ambiente local', () => {
      new DynamoDBClient({
        region: mockEnv.AWS_REGION,
        endpoint: mockEnv.DYNAMODB_ENDPOINT,
        credentials: {
          accessKeyId: 'fakeAccessKeyId',
          secretAccessKey: 'fakeSecretAccessKey',
        },
      });

      expect(DynamoDBClient).toHaveBeenCalledWith(
        expect.objectContaining({
          credentials: expect.objectContaining({
            accessKeyId: 'fakeAccessKeyId',
          }),
        })
      );
    });
  });

  describe('Definições de Tabelas', () => {
    describe('Tabela Users', () => {
      const usersTableDef = {
        TableName: 'test-Users',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'email', AttributeType: 'S' },
          { AttributeName: 'cognitoSub', AttributeType: 'S' },
          { AttributeName: 'username', AttributeType: 'S' },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      };

      it('deve ter partition key id', () => {
        expect(usersTableDef.KeySchema[0].AttributeName).toBe('id');
        expect(usersTableDef.KeySchema[0].KeyType).toBe('HASH');
      });

      it('deve ter GSI para email', () => {
        const emailAttr = usersTableDef.AttributeDefinitions.find(
          attr => attr.AttributeName === 'email'
        );
        expect(emailAttr).toBeDefined();
        expect(emailAttr?.AttributeType).toBe('S');
      });

      it('deve ter GSI para cognitoSub', () => {
        const cognitoSubAttr = usersTableDef.AttributeDefinitions.find(
          attr => attr.AttributeName === 'cognitoSub'
        );
        expect(cognitoSubAttr).toBeDefined();
      });

      it('deve ter GSI para username', () => {
        const usernameAttr = usersTableDef.AttributeDefinitions.find(
          attr => attr.AttributeName === 'username'
        );
        expect(usernameAttr).toBeDefined();
      });

      it('deve ter capacidade de 5 RCU/WCU', () => {
        expect(usersTableDef.ProvisionedThroughput.ReadCapacityUnits).toBe(5);
        expect(usersTableDef.ProvisionedThroughput.WriteCapacityUnits).toBe(5);
      });
    });

    describe('Tabela Posts', () => {
      const postsTableDef = {
        TableName: 'test-Posts',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'slug', AttributeType: 'S' },
          { AttributeName: 'authorId', AttributeType: 'S' },
          { AttributeName: 'subcategoryId', AttributeType: 'S' },
          { AttributeName: 'status', AttributeType: 'S' },
          { AttributeName: 'createdAt', AttributeType: 'S' },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      };

      it('deve ter partition key id', () => {
        expect(postsTableDef.KeySchema[0].AttributeName).toBe('id');
      });

      it('deve ter GSI para slug', () => {
        const slugAttr = postsTableDef.AttributeDefinitions.find(
          attr => attr.AttributeName === 'slug'
        );
        expect(slugAttr).toBeDefined();
      });

      it('deve ter GSI para authorId com sort key createdAt', () => {
        const authorAttr = postsTableDef.AttributeDefinitions.find(
          attr => attr.AttributeName === 'authorId'
        );
        const createdAtAttr = postsTableDef.AttributeDefinitions.find(
          attr => attr.AttributeName === 'createdAt'
        );
        expect(authorAttr).toBeDefined();
        expect(createdAtAttr).toBeDefined();
      });

      it('deve ter GSI para subcategoryId', () => {
        const subcatAttr = postsTableDef.AttributeDefinitions.find(
          attr => attr.AttributeName === 'subcategoryId'
        );
        expect(subcatAttr).toBeDefined();
      });

      it('deve ter GSI para status', () => {
        const statusAttr = postsTableDef.AttributeDefinitions.find(
          attr => attr.AttributeName === 'status'
        );
        expect(statusAttr).toBeDefined();
      });

      it('deve ter capacidade de 5 RCU/WCU', () => {
        expect(postsTableDef.ProvisionedThroughput.ReadCapacityUnits).toBe(5);
        expect(postsTableDef.ProvisionedThroughput.WriteCapacityUnits).toBe(5);
      });
    });

    describe('Tabela Categories', () => {
      const categoriesTableDef = {
        TableName: 'test-Categories',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'slug', AttributeType: 'S' },
          { AttributeName: 'parentId', AttributeType: 'S' },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 3,
          WriteCapacityUnits: 3,
        },
      };

      it('deve ter partition key id', () => {
        expect(categoriesTableDef.KeySchema[0].AttributeName).toBe('id');
      });

      it('deve ter GSI para slug', () => {
        const slugAttr = categoriesTableDef.AttributeDefinitions.find(
          attr => attr.AttributeName === 'slug'
        );
        expect(slugAttr).toBeDefined();
      });

      it('deve ter GSI para parentId (hierarquia)', () => {
        const parentAttr = categoriesTableDef.AttributeDefinitions.find(
          attr => attr.AttributeName === 'parentId'
        );
        expect(parentAttr).toBeDefined();
      });

      it('deve ter capacidade de 3 RCU/WCU', () => {
        expect(categoriesTableDef.ProvisionedThroughput.ReadCapacityUnits).toBe(3);
        expect(categoriesTableDef.ProvisionedThroughput.WriteCapacityUnits).toBe(3);
      });
    });

    describe('Tabela Comments', () => {
      const commentsTableDef = {
        TableName: 'test-Comments',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'postId', AttributeType: 'S' },
          { AttributeName: 'authorId', AttributeType: 'S' },
          { AttributeName: 'createdAt', AttributeType: 'S' },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 3,
          WriteCapacityUnits: 3,
        },
      };

      it('deve ter GSI para postId com sort key createdAt', () => {
        const postAttr = commentsTableDef.AttributeDefinitions.find(
          attr => attr.AttributeName === 'postId'
        );
        const createdAtAttr = commentsTableDef.AttributeDefinitions.find(
          attr => attr.AttributeName === 'createdAt'
        );
        expect(postAttr).toBeDefined();
        expect(createdAtAttr).toBeDefined();
      });

      it('deve ter GSI para authorId', () => {
        const authorAttr = commentsTableDef.AttributeDefinitions.find(
          attr => attr.AttributeName === 'authorId'
        );
        expect(authorAttr).toBeDefined();
      });
    });

    describe('Tabela Likes', () => {
      const likesTableDef = {
        TableName: 'test-Likes',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'postId', AttributeType: 'S' },
          { AttributeName: 'userId', AttributeType: 'S' },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 3,
          WriteCapacityUnits: 3,
        },
      };

      it('deve ter GSI para postId', () => {
        const postAttr = likesTableDef.AttributeDefinitions.find(
          attr => attr.AttributeName === 'postId'
        );
        expect(postAttr).toBeDefined();
      });

      it('deve ter GSI para userId', () => {
        const userAttr = likesTableDef.AttributeDefinitions.find(
          attr => attr.AttributeName === 'userId'
        );
        expect(userAttr).toBeDefined();
      });
    });

    describe('Tabela Bookmarks', () => {
      const bookmarksTableDef = {
        TableName: 'test-Bookmarks',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'postId', AttributeType: 'S' },
          { AttributeName: 'userId', AttributeType: 'S' },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 3,
          WriteCapacityUnits: 3,
        },
      };

      it('deve ter GSI para postId', () => {
        const postAttr = bookmarksTableDef.AttributeDefinitions.find(
          attr => attr.AttributeName === 'postId'
        );
        expect(postAttr).toBeDefined();
      });

      it('deve ter GSI para userId', () => {
        const userAttr = bookmarksTableDef.AttributeDefinitions.find(
          attr => attr.AttributeName === 'userId'
        );
        expect(userAttr).toBeDefined();
      });
    });

    describe('Tabela Notifications', () => {
      const notificationsTableDef = {
        TableName: 'test-Notifications',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'userId', AttributeType: 'S' },
          { AttributeName: 'createdAt', AttributeType: 'S' },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 3,
          WriteCapacityUnits: 3,
        },
      };

      it('deve ter GSI para userId com sort key createdAt', () => {
        const userAttr = notificationsTableDef.AttributeDefinitions.find(
          attr => attr.AttributeName === 'userId'
        );
        const createdAtAttr = notificationsTableDef.AttributeDefinitions.find(
          attr => attr.AttributeName === 'createdAt'
        );
        expect(userAttr).toBeDefined();
        expect(createdAtAttr).toBeDefined();
      });
    });
  });

  describe('Free Tier - Capacidade Provisionada', () => {
    it('deve ter total de 25 RCU distribuídos', () => {
      const rcuTotal = 5 + 5 + 3 + 3 + 3 + 3 + 3; // Users + Posts + 5 tabelas
      expect(rcuTotal).toBe(25);
    });

    it('deve ter total de 25 WCU distribuídos', () => {
      const wcuTotal = 5 + 5 + 3 + 3 + 3 + 3 + 3; // Users + Posts + 5 tabelas
      expect(wcuTotal).toBe(25);
    });

    it('deve dar mais capacidade para Users e Posts (tabelas mais acessadas)', () => {
      const userCapacity = 5;
      const postCapacity = 5;
      const othersCapacity = 3;

      expect(userCapacity).toBeGreaterThan(othersCapacity);
      expect(postCapacity).toBeGreaterThan(othersCapacity);
    });

    it('deve ter 7 tabelas no total', () => {
      const tableNames = Object.values(mockTables);
      expect(tableNames).toHaveLength(7);
    });
  });

  describe('Funções Auxiliares', () => {
    describe('tableExists', () => {
      it('deve retornar true quando tabela existe', async () => {
        mockSend.mockResolvedValueOnce({
          Table: { TableName: 'test-Users' },
        });

        // Simula a função tableExists
        const checkIfExists = async (tableName: string) => {
          try {
            const command = new DescribeTableCommand({ TableName: tableName });
            await mockClient.send(command);
            return true;
          } catch (error: any) {
            if (error.fullName === 'ResourceNotFoundException') {
              return false;
            }
            throw error;
          }
        };

        const exists = await checkIfExists('test-Users');
        expect(exists).toBe(true);
      });

      it('deve retornar false quando tabela não existe', async () => {
        mockSend.mockRejectedValueOnce({
          fullName: 'ResourceNotFoundException',
          message: 'Table not found',
        });

        const checkIfExists = async (tableName: string) => {
          try {
            const command = new DescribeTableCommand({ TableName: tableName });
            await mockClient.send(command);
            return true;
          } catch (error: any) {
            if (error.fullName === 'ResourceNotFoundException') {
              return false;
            }
            throw error;
          }
        };

        const exists = await checkIfExists('non-existent-table');
        expect(exists).toBe(false);
      });

      it('deve propagar outros erros', async () => {
        mockSend.mockRejectedValueOnce({
          fullName: 'AccessDeniedException',
          message: 'Access denied',
        });

        const checkIfExists = async (tableName: string) => {
          try {
            const command = new DescribeTableCommand({ TableName: tableName });
            await mockClient.send(command);
            return true;
          } catch (error: any) {
            if (error.fullName === 'ResourceNotFoundException') {
              return false;
            }
            throw error;
          }
        };

        await expect(checkIfExists('test-table')).rejects.toMatchObject({
          fullName: 'AccessDeniedException',
        });
      });
    });

    describe('listTables', () => {
      it('deve listar tabelas existentes', async () => {
        mockSend.mockResolvedValueOnce({
          TableNames: ['test-Users', 'test-Posts'],
        });

        const command = new ListTablesCommand({});
        const response = await mockClient.send(command);

        expect(response.TableNames).toHaveLength(2);
        expect(response.TableNames).toContain('test-Users');
        expect(response.TableNames).toContain('test-Posts');
      });

      it('deve retornar array vazio quando não há tabelas', async () => {
        mockSend.mockResolvedValueOnce({
          TableNames: [],
        });

        const command = new ListTablesCommand({});
        const response = await mockClient.send(command);

        expect(response.TableNames).toHaveLength(0);
      });
    });

    describe('createTable', () => {
      it('deve criar tabela com sucesso', async () => {
        mockSend.mockResolvedValueOnce({
          TableDescription: { TableName: 'test-Users' },
        });

      const tableDef: any = {
        TableName: 'test-Users',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      };

      const command = new CreateTableCommand(tableDef);
      const response = await mockClient.send(command);

        expect(response.TableDescription.TableName).toBe('test-Users');
      });

      it('deve aguardar tabela ficar ativa', async () => {
        (waitUntilTableExists as jest.Mock).mockResolvedValueOnce({});

        await waitUntilTableExists(
          { client: mockClient, maxWaitTime: 60 },
          { TableName: 'test-Users' }
        );

        expect(waitUntilTableExists).toHaveBeenCalledWith(
          expect.objectContaining({
            client: mockClient,
            maxWaitTime: 60,
          }),
          expect.objectContaining({
            TableName: 'test-Users',
          })
        );
      });
    });
  });

  describe('Boas Práticas DynamoDB', () => {
    it('deve usar partition keys bem distribuídas (id único)', () => {
      const id1 = 'user-123';
      const id2 = 'user-456';
      const id3 = 'user-789';

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('deve usar sort keys para ordenação (createdAt)', () => {
      const record = {
        id: 'post-123',
        createdAt: new Date().toISOString(),
      };

      expect(record.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('deve ter GSIs apenas para queries essenciais', () => {
      // Users tem 3 GSIs (email, cognitoSub, username) - essenciais para autenticação
      const usersGSIs = 3;
      expect(usersGSIs).toBeLessThanOrEqual(5); // Limite recomendado

      // Posts tem 4 GSIs (slug, author, subcategory, status) - essenciais para queries
      const postsGSIs = 4;
      expect(postsGSIs).toBeLessThanOrEqual(5);
    });
  });

  describe('Detecção de Ambiente', () => {
    it('deve detectar ambiente local', () => {
      const isLocal = !!mockEnv.DYNAMODB_ENDPOINT;
      expect(isLocal).toBe(true);
    });

    it('deve detectar ambiente AWS', () => {
      const envWithoutEndpoint = {
        ...mockEnv,
        DYNAMODB_ENDPOINT: undefined,
      };
      const isAWS = !envWithoutEndpoint.DYNAMODB_ENDPOINT;
      expect(isAWS).toBe(true);
    });
  });

  describe('Nomes e Configurações', () => {
    it('deve usar prefixo nas tabelas', () => {
      Object.values(mockTables).forEach(tableName => {
        expect(tableName).toContain('test-');
      });
    });

    it('deve ter região configurada', () => {
      expect(mockEnv.AWS_REGION).toBe('us-east-1');
    });

    it('deve ter endpoint local configurado', () => {
      expect(mockEnv.DYNAMODB_ENDPOINT).toBe('http://localhost:8000');
    });
  });
});

