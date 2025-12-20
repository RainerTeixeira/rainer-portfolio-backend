/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  DeleteCommand,
  BatchGetCommand,
  BatchWriteCommand,
  ScanCommand as DocScanCommand
} from '@aws-sdk/lib-dynamodb';
import {
  UpdateItemCommand,
  QueryCommand,
  TransactWriteItemsCommand
} from '@aws-sdk/client-dynamodb';
import { ConfigService } from '@nestjs/config';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

@Injectable()
export class DynamoDBService implements OnModuleInit {
  private readonly logger = new Logger(DynamoDBService.name);
  private client: DynamoDBClient | undefined;
  private docClient: DynamoDBDocumentClient | undefined;
  private tableName: string = 'portfolio-backend-table';
  private isInitialized: boolean = false;

  constructor(@Optional() private configService?: ConfigService) {
    // Se não há ConfigService ou DATABASE_PROVIDER não é DYNAMODB, não inicializa
    if (!this.configService) {
      this.logger.warn('ConfigService não disponível, DynamoDB não será inicializado');
      return;
    }

    const dbProvider = this.configService.get<string>('DATABASE_PROVIDER', 'PRISMA');
    console.log('DynamoDBService.constructor - DATABASE_PROVIDER:', dbProvider);
    if (dbProvider !== 'DYNAMODB') {
      this.logger.log('DynamoDB skipped (DATABASE_PROVIDER is not "DYNAMODB")');
      return;
    }

    try {
      // Configuração do cliente DynamoDB
      this.client = new DynamoDBClient({
        region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
        // Para ambiente local, aponte para DynamoDB Local
        ...(process.env.NODE_ENV === 'development' && {
          endpoint: this.configService.get<string>('DYNAMODB_ENDPOINT'),
          credentials: {
            accessKeyId: this.configService.get<string>('DYNAMODB_ACCESS_KEY_ID', 'dummy'),
            secretAccessKey: this.configService.get<string>('DYNAMODB_SECRET_ACCESS_KEY', 'dummy'),
          },
        }),
      });

      this.docClient = DynamoDBDocumentClient.from(this.client, {
        marshallOptions: {
          // Converte automaticamente undefined para null
          removeUndefinedValues: true,
          // Converte booleanos para strings se necessário
          convertClassInstanceToMap: true,
        },
      });

      this.tableName = this.configService.get<string>('DYNAMODB_TABLE') || 'portfolio-backend-table';
      console.log('DynamoDBService.constructor - tableName:', this.tableName);
      this.isInitialized = true;
      console.log('DynamoDBService.constructor - initialized successfully');
    } catch (error) {
      this.logger.error('Erro ao inicializar DynamoDB', error);
    }
  }

  async onModuleInit() {
    // Se não foi inicializado no construtor, não faz nada
    if (!this.isInitialized) {
      return;
    }

    // Verifica se deve usar DynamoDB
    const dbProvider = this.configService?.get<string>('DATABASE_PROVIDER', 'PRISMA');
    if (dbProvider !== 'DYNAMODB') {
      this.logger.log('DynamoDB skipped (DATABASE_PROVIDER is not "DYNAMODB")');
      return;
    }

    // Verifica conexão com a tabela
    this.logger.log('Checking DynamoDB connection...');
    try {
      // Adiciona timeout de 5 segundos para evitar travamento
      await Promise.race([
        this.docClient?.send(
          new GetCommand({
            TableName: this.tableName,
            Key: { PK: 'HEALTH_CHECK', SK: 'HEALTH_CHECK' },
          })
        ),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('DynamoDB connection timeout after 5 seconds')), 5000)
        )
      ]);
      this.logger.log('DynamoDB connection successful');
    } catch (error) {
      // Ignora erro de NotFound, apenas verifica se a tabela existe
      if (error instanceof Error) {
        if (error.name === 'ResourceNotFoundException' || error.message.includes('timeout')) {
          this.logger.warn('DynamoDB table not found or connection timeout, continuing...');
        } else {
          this.logger.error('DynamoDB connection error:', error.message);
        }
      }
    }
  }

  /**
   * Obtém um item pela chave
   */
  async get<T>(key: Record<string, any>, tableName?: string): Promise<T | null> {
    if (!this.docClient) {
      throw new ServiceUnavailableException('DynamoDB client not initialized');
    }
    try {
      const result = await this.docClient.send(
        new GetCommand({
          TableName: tableName || this.tableName,
          Key: key,
        })
      );
      return result.Item as T || null;
    } catch (error) {
      const e = error as any;
      const name = typeof e?.name === 'string' ? e.name : '';
      const message = typeof e?.message === 'string' ? e.message : String(e);

      this.logger.error(`Failed to get item from DynamoDB: ${message}`);

      if (
        name === 'ResourceNotFoundException' ||
        message.includes('ResourceNotFoundException') ||
        message.toLowerCase().includes('requested resource not found')
      ) {
        throw new ServiceUnavailableException('DynamoDB table not found. Run pnpm run dynamodb:create-tables.');
      }

      if (message.toLowerCase().includes('connect') || message.toLowerCase().includes('econnrefused')) {
        throw new ServiceUnavailableException('DynamoDB endpoint not reachable. Is dynamodb-local running?');
      }

      throw new InternalServerErrorException('Failed to query DynamoDB');
    }
  }

  /**
   * Insere um item
   */
  async put(item: Record<string, any>, tableName?: string): Promise<void> {
    if (!this.docClient) {
      throw new ServiceUnavailableException('DynamoDB client not initialized');
    }
    try {
      await this.docClient.send(
        new PutCommand({
          TableName: tableName || this.tableName,
          Item: item,
        })
      );
    } catch (error) {
      const e = error as any;
      const name = typeof e?.name === 'string' ? e.name : '';
      const message = typeof e?.message === 'string' ? e.message : String(e);
      this.logger.error('Failed to put item', message);

      if (name === 'ResourceNotFoundException' || message.includes('ResourceNotFoundException')) {
        throw new ServiceUnavailableException('DynamoDB table not found. Run pnpm run dynamodb:create-tables.');
      }

      if (message.toLowerCase().includes('connect') || message.toLowerCase().includes('econnrefused')) {
        throw new ServiceUnavailableException('DynamoDB endpoint not reachable. Is dynamodb-local running?');
      }

      throw new InternalServerErrorException('Failed to write to DynamoDB');
    }
  }

  /**
   * Atualiza um item
   */
  async update(pk: string, sk: string, updateData: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.client) {
      throw new Error('DynamoDB client not initialized');
    }
    const command = new UpdateItemCommand({
      TableName: this.tableName,
      Key: marshall({ PK: pk, SK: sk }),
      UpdateExpression: 'SET #data = :data',
      ExpressionAttributeNames: {
        '#data': 'data',
      },
      ExpressionAttributeValues: marshall({
        ':data': updateData,
      }),
      ReturnValues: 'ALL_NEW',
    });

    const result = await this.client.send(command);
    return unmarshall(result.Attributes || {});
  }

  /**
   * Query por PK
   */
  async queryByPK(pk: string, options?: any): Promise<Record<string, unknown>[]> {
    if (!this.client) {
      throw new Error('DynamoDB client not initialized');
    }
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: marshall({
        ':pk': pk,
      }),
      ...options,
    });

    const result = await this.client.send(command);
    return result.Items?.map(item => unmarshall(item)) || [];
  }

  /**
   * Query por GSI1
   */
  async queryByGSI1(gsi1pk: string, options?: any): Promise<Record<string, unknown>[]> {
    if (!this.client) {
      throw new Error('DynamoDB client not initialized');
    }
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: marshall({
        ':gsi1pk': gsi1pk,
      }),
      ...options,
    });

    const result = await this.client.send(command);
    return result.Items?.map(item => unmarshall(item)) || [];
  }

  /**
   * Query por GSI2
   */
  async queryByGSI2(gsi2pk: string, options?: any): Promise<Record<string, unknown>[]> {
    if (!this.client) {
      throw new Error('DynamoDB client not initialized');
    }
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :gsi2pk',
      ExpressionAttributeValues: marshall({
        ':gsi2pk': gsi2pk,
      }),
      ...options,
    });

    const result = await this.client.send(command);
    return result.Items?.map(item => unmarshall(item)) || [];
  }

  /**
   * Scan na tabela
   */
  async scan(options?: any, tableName?: string): Promise<Record<string, unknown>[]> {
    if (!this.docClient) {
      console.error('DynamoDBService.scan - DynamoDB client not initialized');
      throw new Error('DynamoDB client not initialized');
    }
    
    const tableToUse = tableName || this.tableName;
    console.log('DynamoDBService.scan - scanning table:', tableToUse);
    
    try {
      const command = new DocScanCommand({
        TableName: tableToUse,
        ...options,
      });

      const result = await this.docClient.send(command);
      console.log('DynamoDBService.scan - items found:', result.Items?.length || 0);
      if (result.Items && result.Items.length > 0) {
        console.log('DynamoDBService.scan - first item sample:', JSON.stringify(result.Items[0], null, 2));
      }
      return result.Items || [];
    } catch (error) {
      console.error('DynamoDBService.scan - error scanning table:', tableToUse);
      console.error('DynamoDBService.scan - error details:', error);
      // Don't return empty array, throw the error so we can see what's wrong
      throw error;
    }
  }

  /**
   * Remove um item
   */
  async delete(pk: string, _sk: string, tableName?: string): Promise<void> {
    if (!this.docClient) {
      throw new ServiceUnavailableException('DynamoDB client not initialized');
    }
    
    let key: any;
    if (tableName?.includes('users')) {
      key = { cognitoSub: pk };
    } else {
      key = { id: pk };
    }
    
    await this.docClient.send(
      new DeleteCommand({
        TableName: tableName || this.tableName,
        Key: key,
      })
    );
  }

  /**
   * Batch get - obtém múltiplos itens
   */
  async batchGet(keys: { PK: string; SK: string }[]): Promise<any[]> {
    if (!this.docClient) {
      throw new Error('DynamoDB client not initialized');
    }
    const result = await this.docClient.send(
      new BatchGetCommand({
        RequestItems: {
          [this.tableName]: {
            Keys: keys,
          },
        },
      })
    );

    return result.Responses?.[this.tableName] || [];
  }

  /**
   * Batch write - múltiplas operações
   */
  async batchWrite(
    putRequests: any[] = [],
    deleteRequests: { PK: string; SK: string }[] = []
  ): Promise<void> {
    if (!this.docClient) {
      throw new Error('DynamoDB client not initialized');
    }
    const requestItems: any[] = [];

    // Adiciona operações PUT
    putRequests.forEach(item => {
      requestItems.push({
        PutRequest: { Item: item },
      });
    });

    // Adiciona operações DELETE
    deleteRequests.forEach(key => {
      requestItems.push({
        DeleteRequest: { Key: key },
      });
    });

    // Divide em lotes de 25 (limite do DynamoDB)
    for (let i = 0; i < requestItems.length; i += 25) {
      const batch = requestItems.slice(i, i + 25);
      
      await this.docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [this.tableName]: batch,
          },
        })
      );
    }
  }

  /**
   * Transação write - múltiplas operações atômicas
   */
  async transactWrite(transactItems: any[]): Promise<void> {
    if (!this.client) {
      throw new Error('DynamoDB client not initialized');
    }
    await this.client.send(
      new TransactWriteItemsCommand({
        TransactItems: transactItems,
      })
    );
  }

  /**
   * Obtém o nome da tabela
   */
  getTableName(): string {
    return this.tableName;
  }

  /**
   * Obtém o cliente DynamoDB para operações avançadas
   */
  getDocumentClient() {
    return this.docClient;
  }
}
