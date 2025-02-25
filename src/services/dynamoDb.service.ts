import { Injectable, Logger } from '@nestjs/common';
import {
  DynamoDBClient,
  DynamoDBClientConfig,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  ScanCommand, // Importante: ScanCommand para escanear tabelas
  QueryCommand,
  BatchWriteItemCommand, // Correção: Importe BatchWriteItemCommand (já estava correto)
  BatchGetItemCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  DynamoDBDocumentClient,
  TranslateConfig,
  GetCommandInput,
  PutCommandInput,
  UpdateCommandInput,
  DeleteCommandInput,
  ScanCommandInput, // Importante: ScanCommandInput para tipagem do método scan
  QueryCommandInput,
  BatchWriteCommandInput,
  BatchGetCommandInput,
} from '@aws-sdk/lib-dynamodb';
import * as dotenv from 'dotenv'; // Importa dotenv para carregar variáveis do .env

dotenv.config(); // Carrega as variáveis de ambiente do .env para o process.env

/**
 * Serviço responsável por abstrair e fornecer uma interface para interações com o banco de dados DynamoDB.
 * Utiliza o AWS SDK v3 e o DynamoDB Document Client para facilitar a manipulação de itens.
 * Inclui métodos para operações CRUD (Create, Read, Update, Delete) e operações em lote,
 * além de tratamento de erros e construção dinâmica de expressões de atualização.
 */
@Injectable()
export class DynamoDbService {
  private readonly logger = new Logger(DynamoDbService.name); // Logger para registrar mensagens e erros do serviço
  private readonly docClient: DynamoDBDocumentClient; // Cliente do DynamoDB Document, facilita o trabalho com objetos JavaScript

  /**
   * Construtor do DynamoDbService.
   * Inicializa o DynamoDB Document Client com configurações regionais e, opcionalmente,
   * endpoint local para desenvolvimento, lendo as configurações de variáveis de ambiente.
   */
  constructor() {
    this.logger.log('DynamoDbService constructor iniciado'); // Log adicionado - INÍCIO
    this.logger.log(`AWS Region: ${process.env.AWS_REGION}`); // Log adicionado - AWS_REGION
    this.logger.log(`DynamoDB Endpoint: ${process.env.DYNAMODB_ENDPOINT}`); // Log adicionado - DYNAMODB_ENDPOINT
    // Configuração base do cliente DynamoDB (AWS SDK v3)
    const clientConfig: DynamoDBClientConfig = {
      region: process.env.AWS_REGION || 'us-east-1', // Define a região da AWS. Se AWS_REGION não estiver definido, usa 'us-east-1' como padrão.
      // Permite configurar um endpoint local para DynamoDB, útil para desenvolvimento e testes locais.
      ...(process.env.LOCAL_DYNAMO_ENDPOINT && {
        endpoint: process.env.LOCAL_DYNAMO_ENDPOINT,
      }),
      // Credenciais não são explicitamente configuradas aqui. O SDK v3 utiliza o Default Credential Provider Chain,
      // que busca credenciais automaticamente em variáveis de ambiente, arquivos de configuração, roles IAM, etc.
      // Em produção, é fortemente recomendado utilizar IAM Roles para segurança e evitar hardcodar credenciais.
    };

    // Configuração de tradução para o Document Client.
    // Facilita a conversão entre formatos JavaScript e DynamoDB, permitindo trabalhar com objetos JavaScript diretamente.
    const translateConfig: TranslateConfig = {
      marshallOptions: {
        removeUndefinedValues: true, // Remove valores `undefined` de objetos JavaScript antes de enviar para o DynamoDB. Limpa payloads desnecessários.
        convertClassInstanceToMap: true, // Permite converter instâncias de classes JavaScript para mapas (objetos) ao salvar no DynamoDB.
        convertEmptyValues: false, // Impede a conversão de valores JavaScript "vazios" (como strings vazias, 0) para tipos vazios do DynamoDB.
      },
      unmarshallOptions: {
        wrapNumbers: false, // Ao converter dados do DynamoDB de volta para JavaScript, não envolve números em objetos `Number`. Mantém tipos primitivos.
      },
    };

    try {
      // Cria e inicializa o DynamoDB Document Client, combinando as configurações do cliente base e de tradução.
      this.docClient = DynamoDBDocumentClient.from(
        new DynamoDBClient(clientConfig), // Cria o cliente DynamoDB base com as configurações de região e endpoint.
        translateConfig // Aplica as configurações de tradução para facilitar o uso de objetos JavaScript.
      );
      this.logger.log('DynamoDB DocumentClient inicializado com sucesso'); // Loga a inicialização bem-sucedida do cliente.
    } catch (error) {
      this.logger.error('Erro ao inicializar DynamoDB DocumentClient:', error); // Loga erro na inicialização.
      throw error;
    }
    this.logger.log('DynamoDbService constructor finalizado'); // Log adicionado - FIM
  }

  /**
   * Recupera um item do DynamoDB com base em sua chave primária.
   * @param params - Objeto contendo os parâmetros para a operação GetItemCommandInput,
   *                                     incluindo TableName e Key (chave primária do item).
   * @returns Promise<any> - Promise que resolve para a resposta do DynamoDB contendo o item recuperado (se encontrado).
   * @throws DynamoDBError - Em caso de falha na operação do DynamoDB, lança um erro tratado.
   */
  async getItem(params: DynamoDB.DocumentClient.GetItemInput): Promise<DynamoDB.DocumentClient.GetItemOutput> {
    try {
      this.logger.log(`getItem: Iniciando operação getItem com params: ${JSON.stringify(params)}`);
      // Mudança Importante: Removendo .promise() para usar async/await com SDK v3 Document Client
      const result = await this.docClient.get(params);
      this.logger.log(`getItem: Resposta completa do DynamoDB SDK: ${JSON.stringify(result, null, 2)}`); // <--- ADICIONE ESTE LOG DETALHADO
      return result;
    } catch (error) {
      this.handleError('getItem', error, 'Erro na operação getItem');
      throw error;
    }
  }

  /**
   * Cria um novo item ou substitui um item existente no DynamoDB.
   * @param params - Objeto contendo os parâmetros para a operação PutItemCommandInput,
   *                                     incluindo TableName e Item (o item a ser criado ou substituído).
   * @returns Promise<any> - Promise que resolve para a resposta do DynamoDB após a operação de PutItem.
   * @throws DynamoDBError - Em caso de falha na operação do DynamoDB, lança um erro tratado.
   */
  async putItem(params: PutCommandInput) {
    try {
      const command = new PutItemCommand(params); // Cria um comando PutItemCommand com os parâmetros fornecidos.
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e aguarda a resposta.
    } catch (error) {
      this.handleError('putItem', error, 'Erro na operação putItem'); // Adicionando nome da operação no handleError
    }
  }

  /**
   * Atualiza um item existente no DynamoDB. Permite atualizar atributos específicos de um item.
   * @param params - Objeto contendo os parâmetros para a operação UpdateItemInput,
   *                                     incluindo TableName, Key (chave primária do item) e UpdateExpression (expressão de atualização).
   * @returns Promise<any> - Promise que resolve para a resposta do DynamoDB após a operação de UpdateItem.
   * @throws DynamoDBError - Em caso de falha na operação do DynamoDB, lança um erro tratado.
   */
  async updateItem(params: UpdateCommandInput) {
    try {
      const command = new UpdateItemCommand(params); // Cria um comando UpdateItemCommand com os parâmetros fornecidos.
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e aguarda a resposta.
    } catch (error) {
      this.handleError('updateItem', error, 'Erro na operação updateItem'); // Adicionando nome da operação no handleError
    }
  }

  /**
   * Deleta um item do DynamoDB com base em sua chave primária.
   * @param params - Objeto contendo os parâmetros para a operação DeleteItemCommandInput,
   *                                     incluindo TableName e Key (chave primária do item a ser deletado).
   * @returns Promise<any> - Promise que resolve para a resposta do DynamoDB após a operação de DeleteItem.
   * @throws DynamoDBError - Em caso de falha na operação do DynamoDB, lança um erro tratado.
   */
  async deleteItem(params: DeleteCommandInput) {
    try {
      const command = new DeleteItemCommand(params); // Cria um comando DeleteItemCommand com os parâmetros fornecidos.
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e aguarda a resposta.
    } catch (error) {
      this.handleError('deleteItem', error, 'Erro na operação deleteItem'); // Adicionando nome da operação no handleError
    }
  }

  /**
   * Escaneia uma tabela inteira do DynamoDB. **CUIDADO**: Operação ineficiente para tabelas grandes em produção,
   * pois lê todos os itens da tabela. Deve ser usado com cautela e preferencialmente para tabelas pequenas ou operações administrativas.
   * @param params - Objeto contendo os parâmetros para a operação ScanCommandInput,
   *                                     incluindo TableName (nome da tabela a ser escaneada).
   * @returns Promise<any> - Promise que resolve para a resposta do DynamoDB contendo os itens escaneados.
   * @throws DynamoDBError - Em caso de falha na operação do DynamoDB, lança um erro tratado.
   */
  async scan(params: ScanCommandInput) {
    try {
      const command = new ScanCommand(params); // Cria um comando ScanCommand com os parâmetros fornecidos.
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e aguarda a resposta.
    } catch (error) {
      this.handleError('scan', error, 'Erro na operação scan'); // Adicionando nome da operação no handleError
    }
  }

  /**
   * Consulta itens do DynamoDB utilizando a operação Query. Mais eficiente que Scan para consultas baseadas em chave de partição
   * e, opcionalmente, chave de classificação. Ideal para buscar subconjuntos de dados específicos.
   * @param params - Objeto contendo os parâmetros para a operação QueryCommandInput,
   *                                     incluindo TableName, KeyConditionExpression (condição de consulta) e ExpressionAttributeValues (valores para a condição).
   * @returns Promise<any> - Promise que resolve para a resposta do DynamoDB contendo os itens que correspondem à consulta.
   * @throws DynamoDBError - Em caso de falha na operação do DynamoDB, lança um erro tratado.
   */
  async queryItems(params: QueryCommandInput) {
    try {
      const command = new QueryCommand(params); // Cria um comando QueryCommand com os parâmetros fornecidos.
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e aguarda a resposta.
    } catch (error) {
      this.handleError('queryItems', error, 'Erro na operação queryItems'); // Adicionando nome da operação no handleError
    }
  }

  /**
   * Consulta itens do DynamoDB utilizando a operação Query.
   * Ideal para buscas baseadas em chave de partição e, opcionalmente, chave de classificação.
   * @param params - Objeto contendo os parâmetros para a operação QueryCommandInput.
   * @returns Promise<any> - Promise que resolve para a resposta do DynamoDB contendo os itens que correspondem à consulta.
   * @throws DynamoDBError - Em caso de falha na operação do DynamoDB, lança um erro tratado.
   */
  async query(params: QueryCommandInput) {
    try {
      const command = new QueryCommand(params); // Cria um comando QueryCommand com os parâmetros fornecidos.
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e aguarda a resposta.
    } catch (error) {
      this.handleError('query', error, 'Erro na operação query'); // Trata e lança o erro
    }
  }


  /**
   * Realiza operações de escrita em lote no DynamoDB, permitindo criar ou deletar múltiplos itens de forma eficiente
   * em uma única requisição. Ideal para importação de dados ou operações que afetam múltiplos itens simultaneamente.
   * @param params - Objeto contendo os parâmetros para a operação BatchWriteCommandInput,
   *                                     incluindo RequestItems (um mapa de tabelas para operações de PutRequest e DeleteRequest).
   * @returns Promise<any> - Promise que resolve para a resposta do DynamoDB após a operação BatchWriteItem.
   * @throws DynamoDBError - Em caso de falha na operação do DynamoDB, lança um erro tratado.
   */
  async batchWrite(params: BatchWriteCommandInput) {
    try {
      const command = new BatchWriteItemCommand(params); // Usa BatchWriteItemCommand. Cria o comando BatchWriteItemCommand.
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e aguarda a resposta.
    } catch (error) {
      this.handleError('batchWrite', error, 'Erro na operação batchWrite'); // Adicionando nome da operação no handleError
    }
  }

  /**
   * Realiza operações de leitura em lote no DynamoDB, permitindo buscar múltiplos itens de diferentes tabelas ou da mesma tabela
   * de forma eficiente em uma única requisição. Útil para reduzir o número de requisições ao buscar dados relacionados.
   * @param params - Objeto contendo os parâmetros para a operação BatchGetCommandInput,
   *                                     incluindo RequestItems (um mapa de tabelas para GetRequest com as chaves dos itens a serem buscados).
   * @returns Promise<any> - Promise que resolve para a resposta do DynamoDB após a operação BatchGetItem.
   * @throws DynamoDBError - Em caso de falha na operação do DynamoDB, lança um erro tratado.
   */
  async batchGet(params: BatchGetCommandInput) {
    try {
      const command = new BatchGetItemCommand(params); // Cria um comando BatchGetItemCommand com os parâmetros fornecidos.
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e aguarda a resposta.
    } catch (error) {
      this.handleError('batchGet', error, 'Erro na operação batchGet'); // Adicionando nome da operação no handleError
    }
  }

  /**
   * Método utilitário para construir dinamicamente expressões de atualização (UpdateExpression) para o DynamoDB.
   * Permite atualizar apenas os campos fornecidos em `input`, excluindo opcionalmente chaves especificadas em `excludeKeys`.
   * @param input - Objeto JavaScript contendo os campos a serem atualizados e seus novos valores.
   * @param excludeKeys - Array de strings contendo as chaves que devem ser excluídas da expressão de atualização (opcional).
   * @returns object | null - Retorna um objeto contendo `UpdateExpression`, `ExpressionAttributeNames` e `ExpressionAttributeValues`
   *                                     para usar na operação UpdateItemCommand, ou `null` se não houver campos para atualizar.
   */
  buildUpdateExpression(
    input: Record<string, any>, // Objeto contendo os campos a serem atualizados (chave: nome do atributo, valor: novo valor). `Record<string, any>` garante tipagem flexível.
    excludeKeys: string[] = [] // Array opcional de chaves a serem excluídas da atualização. Útil para campos read-only ou que não devem ser modificados.
  ) {
    const updateKeys = Object.keys(input)
      .filter((key) => !excludeKeys.includes(key))
      .filter((key) => input[key] !== undefined);

    if (updateKeys.length === 0) return null; // Se não houver campos para atualizar, retorna null.

    // Constrói a UpdateExpression utilizando placeholders para evitar conflitos com palavras reservadas.
    const UpdateExpression = `SET ${updateKeys
      .map((key, index) => `#field${index} = :value${index}`)
      .join(', ')}`;

    // Constrói o mapeamento dos placeholders para os nomes reais dos atributos.
    const ExpressionAttributeNames = updateKeys.reduce(
      (acc, key, index) => ({
        ...acc,
        [`#field${index}`]: key,
      }),
      {}
    );

    // Constrói o mapeamento dos placeholders para os valores correspondentes.
    const ExpressionAttributeValues = updateKeys.reduce(
      (acc, key, index) => ({
        ...acc,
        [`:value${index}`]: input[key],
      }),
      {}
    );

    return {
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
    };
  }

  /**
   * Método privado para tratamento centralizado de erros do DynamoDB.
   * Loga o erro e relança um novo erro com uma mensagem mais amigável em português, m
   */
  private handleError(operationName: string, error: any, defaultMessage?: string): void {
    this.logger.error(`DynamoDB Erro em ${operationName}:`, error);

    // Verifica se o erro é uma instância de Error e se tem uma mensagem, ou usa a mensagem padrão
    const errorMessage = error instanceof Error && error.message ? error.message : defaultMessage || 'Erro desconhecido do DynamoDB';

    // Lança um erro mais específico, encapsulando o erro original e a mensagem amigável.
    // Você pode querer criar classes de erro personalizadas para diferentes tipos de erros do DynamoDB.
    throw new DynamoDBError(`Erro na operação ${operationName}: ${errorMessage}`, error);
  }
}

// Classe de Erro Personalizada para DynamoDB
export class DynamoDBError extends Error {
  public readonly originalError: any; // Armazena o erro original para debug mais detalhado

  constructor(message: string, originalError: any) {
    super(message); // Chama o construtor da classe Error com a mensagem amigável
    this.name = 'DynamoDBError'; // Define o nome do erro para identificar a origem
    this.originalError = originalError; // Guarda o erro original
    // Mantém o stack trace original, se disponível
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DynamoDBError);
    }
  }
}