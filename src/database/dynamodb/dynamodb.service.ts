/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  DeleteCommand,
  BatchGetCommand,
  BatchWriteCommand
} from '@aws-sdk/lib-dynamodb';
import {
  UpdateItemCommand,
  QueryCommand,
  ScanCommand,
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
      this.isInitialized = true;
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
  async get<T>(key: Record<string, any>): Promise<T | null> {
    if (!this.docClient) {
      throw new Error('DynamoDB client not initialized');
    }
    try {
      const result = await this.docClient.send(
        new GetCommand({
          TableName: this.tableName,
          Key: key,
        })
      );
      return result.Item as T || null;
    } catch (error) {
      this.logger.error(`Failed to get item from DynamoDB: ${error}`);
      throw error;
    }
  }

  /**
   * Insere um item
   */
  async put(item: Record<string, any>): Promise<void> {
    if (!this.docClient) {
      throw new Error('DynamoDB client not initialized');
    }
    try {
      await this.docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: item,
        })
      );
    } catch (error) {
      this.logger.error('Failed to put item', error instanceof Error ? error.message : 'Unknown error');
      throw error;
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
  async scan(options?: any): Promise<Record<string, unknown>[]> {
    if (!this.client) {
      throw new Error('DynamoDB client not initialized');
    }
    const command = new ScanCommand({
      TableName: this.tableName,
      ...options,
    });

    const result = await this.client.send(command);
    return result.Items?.map(item => unmarshall(item)) || [];
  }

  /**
   * Remove um item
   */
  async delete(pk: string, sk: string): Promise<void> {
    if (!this.docClient) {
      throw new Error('DynamoDB client not initialized');
    }
    await this.docClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { PK: pk, SK: sk },
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
