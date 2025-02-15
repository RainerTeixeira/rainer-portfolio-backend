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
} from '@aws-sdk/client-dynamodb';
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

    // Cria e inicializa o DynamoDB Document Client, combinando as configurações do cliente base e de tradução.
    this.docClient = DynamoDBDocumentClient.from(
      new DynamoDBClient(clientConfig), // Cria o cliente DynamoDB base com as configurações de região e endpoint.
      translateConfig // Aplica as configurações de tradução para facilitar o uso de objetos JavaScript.
    );
    this.logger.log('DynamoDB DocumentClient inicializado usando variáveis de ambiente'); // Loga a inicialização bem-sucedida do cliente.
  }

  /**
   * Recupera um item do DynamoDB com base em sua chave primária.
   * @param params - Objeto contendo os parâmetros para a operação GetItemCommandInput,
   *                 incluindo TableName e Key (chave primária do item).
   * @returns Promise<any> - Promise que resolve para a resposta do DynamoDB contendo o item recuperado (se encontrado).
   * @throws DynamoDBError - Em caso de falha na operação do DynamoDB, lança um erro tratado.
   */
  async getItem(params: GetCommandInput) {
    try {
      const command = new GetItemCommand(params); // Cria um comando GetItemCommand com os parâmetros fornecidos.
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e aguarda a resposta.
    } catch (error) {
      return this.handleError(error, 'getItem'); // Em caso de erro durante a operação, delega o tratamento para o método handleError.
    }
  }

  /**
   * Cria um novo item ou substitui um item existente no DynamoDB.
   * @param params - Objeto contendo os parâmetros para a operação PutItemCommandInput,
   *                 incluindo TableName e Item (o item a ser criado ou substituído).
   * @returns Promise<any> - Promise que resolve para a resposta do DynamoDB após a operação de PutItem.
   * @throws DynamoDBError - Em caso de falha na operação do DynamoDB, lança um erro tratado.
   */
  async putItem(params: PutCommandInput) {
    try {
      const command = new PutItemCommand(params); // Cria um comando PutItemCommand com os parâmetros fornecidos.
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e aguarda a resposta.
    } catch (error) {
      this.handleError(error, 'putItem'); // Em caso de erro durante a operação, delega o tratamento para o método handleError.
    }
  }

  /**
   * Atualiza um item existente no DynamoDB. Permite atualizar atributos específicos de um item.
   * @param params - Objeto contendo os parâmetros para a operação UpdateItemInput,
   *                 incluindo TableName, Key (chave primária do item) e UpdateExpression (expressão de atualização).
   * @returns Promise<any> - Promise que resolve para a resposta do DynamoDB após a operação de UpdateItem.
   * @throws DynamoDBError - Em caso de falha na operação do DynamoDB, lança um erro tratado.
   */
  async updateItem(params: UpdateCommandInput) {
    try {
      const command = new UpdateItemCommand(params); // Cria um comando UpdateItemCommand com os parâmetros fornecidos.
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e aguarda a resposta.
    } catch (error) {
      this.handleError(error, 'updateItem'); // Em caso de erro durante a operação, delega o tratamento para o método handleError.
    }
  }

  /**
   * Deleta um item do DynamoDB com base em sua chave primária.
   * @param params - Objeto contendo os parâmetros para a operação DeleteItemCommandInput,
   *                 incluindo TableName e Key (chave primária do item a ser deletado).
   * @returns Promise<any> - Promise que resolve para a resposta do DynamoDB após a operação de DeleteItem.
   * @throws DynamoDBError - Em caso de falha na operação do DynamoDB, lança um erro tratado.
   */
  async deleteItem(params: DeleteCommandInput) {
    try {
      const command = new DeleteItemCommand(params); // Cria um comando DeleteItemCommand com os parâmetros fornecidos.
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e aguarda a resposta.
    } catch (error) {
      this.handleError(error, 'deleteItem'); // Em caso de erro durante a operação, delega o tratamento para o método handleError.
    }
  }

  /**
   * Escaneia uma tabela inteira do DynamoDB. **CUIDADO**: Operação ineficiente para tabelas grandes em produção,
   * pois lê todos os itens da tabela. Deve ser usado com cautela e preferencialmente para tabelas pequenas ou operações administrativas.
   * @param params - Objeto contendo os parâmetros para a operação ScanCommandInput,
   *                 incluindo TableName (nome da tabela a ser escaneada).
   * @returns Promise<any> - Promise que resolve para a resposta do DynamoDB contendo os itens escaneados.
   * @throws DynamoDBError - Em caso de falha na operação do DynamoDB, lança um erro tratado.
   */
  async scan(params: ScanCommandInput) { // Correção: Renomeado para scan para corresponder ao nome correto da AWS SDK v3.
    try {
      const command = new ScanCommand(params); // Cria um comando ScanCommand com os parâmetros fornecidos.
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e aguarda a resposta.
    } catch (error) {
      this.handleError(error, 'scan'); // Em caso de erro durante a operação, delega o tratamento para o método handleError.
    }
  }

  /**
   * Consulta itens do DynamoDB utilizando a operação Query. Mais eficiente que Scan para consultas baseadas em chave de partição
   * e, opcionalmente, chave de classificação. Ideal para buscar subconjuntos de dados específicos.
   * @param params - Objeto contendo os parâmetros para a operação QueryCommandInput,
   *                 incluindo TableName, KeyConditionExpression (condição de consulta) e ExpressionAttributeValues (valores para a condição).
   * @returns Promise<any> - Promise que resolve para a resposta do DynamoDB contendo os itens que соответем à consulta.
   * @throws DynamoDBError - Em caso de falha na operação do DynamoDB, lança um erro tratado.
   */
  async queryItems(params: QueryCommandInput) {
    try {
      const command = new QueryCommand(params); // Cria um comando QueryCommand com os parâmetros fornecidos.
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e aguarda a resposta.
    } catch (error) {
      this.handleError(error, 'queryItems'); // Em caso de erro durante a operação, delega o tratamento para o método handleError.
    }
  }

  /**
   * Realiza operações de escrita em lote no DynamoDB, permitindo criar ou deletar múltiplos itens de forma eficiente
   * em uma única requisição. Ideal para importação de dados ou operações que afetam múltiplos itens simultaneamente.
   * @param params - Objeto contendo os parâmetros para a operação BatchWriteCommandInput,
   *                 incluindo RequestItems (um mapa de tabelas para operações de PutRequest e DeleteRequest).
   * @returns Promise<any> - Promise que resolve para a resposta do DynamoDB após a operação BatchWriteItem.
   * @throws DynamoDBError - Em caso de falha na operação do DynamoDB, lança um erro tratado.
   */
  async batchWrite(params: BatchWriteCommandInput) {
    try {
      const command = new BatchWriteItemCommand(params); // Correção: Usa BatchWriteItemCommand (já estava correto). Cria o comando BatchWriteItemCommand.
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e aguarda a resposta.
    } catch (error) {
      this.handleError(error, 'batchWrite'); // Em caso de erro durante a operação, delega o tratamento para o método handleError.
    }
  }

  /**
   * Realiza operações de leitura em lote no DynamoDB, permitindo buscar múltiplos itens de diferentes tabelas ou da mesma tabela
   * de forma eficiente em uma única requisição. Útil para reduzir o número de requisições ao buscar dados relacionados.
   * @param params - Objeto contendo os parâmetros para a operação BatchGetCommandInput,
   *                 incluindo RequestItems (um mapa de tabelas para GetRequest com as chaves dos itens a serem buscados).
   * @returns Promise<any> - Promise que resolve para a resposta do DynamoDB após a operação BatchGetItem.
   * @throws DynamoDBError - Em caso de falha na operação do DynamoDB, lança um erro tratado.
   */
  async batchGet(params: BatchGetCommandInput) {
    try {
      const command = new BatchGetItemCommand(params); // Cria um comando BatchGetItemCommand com os parâmetros fornecidos.
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e aguarda a resposta.
    } catch (error) {
      this.handleError(error, 'batchGet'); // Em caso de erro durante a operação, delega o tratamento para o método handleError.
    }
  }

  /**
   * Método utilitário para construir dinamicamente expressões de atualização (UpdateExpression) para o DynamoDB.
   * Permite atualizar apenas os campos fornecidos em `input`, excluindo opcionalmente chaves especificadas em `excludeKeys`.
   * @param input - Objeto JavaScript contendo os campos a serem atualizados e seus novos valores.
   * @param excludeKeys - Array de strings contendo as chaves que devem ser excluídas da expressão de atualização (opcional).
   * @returns object | null - Retorna um objeto contendo `UpdateExpression`, `ExpressionAttributeNames` e `ExpressionAttributeValues`
   *                          para usar na operação UpdateItemCommand, ou `null` se não houver campos para atualizar.
   */
  buildUpdateExpression(
    input: Record<string, any>, // Objeto contendo os campos a serem atualizados (chave: nome do atributo, valor: novo valor). `Record<string, any>` garante tipagem flexível.
    excludeKeys: string[] = [] // Array opcional de chaves a serem excluídas da atualização. Útil para campos read-only ou que não devem ser modificados.
  ) {
    const updateKeys = Object.keys(input) // Obtém todas as chaves do objeto `input`.
      .filter((key) => !excludeKeys.includes(key)) // Filtra as chaves que estão na lista `excludeKeys`, removendo campos excluídos da atualização.
      .filter((key) => input[key] !== undefined); // Filtra chaves cujo valor é `undefined` no objeto `input`. Evita tentar atualizar com valores indefinidos.

    if (updateKeys.length === 0) return null; // Se após a filtragem não restarem chaves para atualizar, retorna `null` indicando que não há atualização a ser feita.

    // Constrói a `UpdateExpression` formatada para o DynamoDB, utilizando placeholders `#field` e `:value` para evitar conflitos com palavras reservadas
    // e prevenir injeção de valores diretamente na string da expressão (boas práticas de segurança).
    const UpdateExpression = `SET ${updateKeys
      .map((key, index) => `#field${index} = :value${index}`) // Para cada chave, cria um segmento "#field[index] = :value[index]". Ex: "#field0 = :value0"
      .join(', ')}`; // Junta todos os segmentos criados com ', ' para formar a UpdateExpression completa. Ex: "SET #field0 = :value0, #field1 = :value1, ..."

    // Constrói `ExpressionAttributeNames`. Mapeia os placeholders `#field[index]` para os nomes reais dos atributos no DynamoDB.
    const ExpressionAttributeNames = updateKeys.reduce(
      (acc, key, index) => ({
        ...acc,
        [`#field${index}`]: key, // Cria um mapeamento para cada chave. Ex: { '#field0': 'nomeDoAtributo' }
      }),
      {} // Inicia com um objeto acumulador vazio.
    );

    // Constrói `ExpressionAttributeValues`. Mapeia os placeholders `:value[index]` para os valores correspondentes no objeto `input`.
    const ExpressionAttributeValues = updateKeys.reduce(
      (acc, key, index) => ({
        ...acc,
        [`:value${index}`]: input[key], // Cria um mapeamento para cada valor. Ex: { ':value0': 'valorDoAtributo' }
      }),
      {} // Inicia com um objeto acumulador vazio.
    );

    // Retorna um objeto contendo todos os componentes necessários para realizar a operação de UpdateItem no DynamoDB.
    return {
      UpdateExpression, // Expressão de atualização formatada (ex: "SET #field0 = :value0, ...")
      ExpressionAttributeNames, // Mapeamento dos placeholders de campo para nomes de atributos (ex: { '#field0': 'nomeDoAtributo' })
      ExpressionAttributeValues, // Mapeamento dos placeholders de valor para valores dos atributos (ex: { ':value0': 'valorDoAtributo' })
    };
  }

  /**
   * Método privado para tratamento centralizado de erros do DynamoDB.
   * Loga o erro e relança um novo erro com uma mensagem mais amigável em português, mapeando erros comuns.
   * @param error - Objeto de erro original capturado durante a operação do DynamoDB.
   * @param operation - String que identifica a operação do DynamoDB que falhou (ex: 'getItem', 'putItem').
   * @returns never - Lança um erro tratado para interromper o fluxo e ser capturado pelo Exception Filter do NestJS.
   */
  private handleError(error: any, operation: string): never {
    this.logger.error(
      `Erro do DynamoDB (${operation}): ${error.message}`, // Loga a mensagem de erro original, incluindo a operação e a mensagem de erro.
      error.stack // Inclui o stacktrace completo do erro para facilitar o debugging e identificar a origem do problema.
    );

    // Cria um novo erro com uma mensagem mapeada e amigável em português, baseada no tipo de erro original.
    const mappedError = new Error(this.mapErrorMessage(error, operation));
    mappedError.name = error.name || 'DynamoDBError'; // Mantém o nome original do erro (se disponível) ou usa 'DynamoDBError' como nome genérico.

    throw mappedError; // Lança o erro tratado. O `never` indica que este método sempre lança um erro e não retorna normalmente.
  }

  /**
   * Método privado para mapear mensagens de erro específicas do DynamoDB para mensagens mais amigáveis e em português.
   * Facilita a interpretação dos erros para usuários da aplicação, abstraindo detalhes técnicos do AWS SDK.
   * @param error - Objeto de erro original do DynamoDB.
   * @param operation - String que identifica a operação do DynamoDB que falhou (ex: 'getItem', 'putItem').
   * @returns string - Mensagem de erro amigável em português correspondente ao erro original, ou uma mensagem genérica.
   */
  private mapErrorMessage(error: any, operation: string): string {
    // Mapeamento de nomes de erros comuns do DynamoDB para mensagens em português.
    // `Record<string, string>` define um tipo para melhor organização e legibilidade do mapeamento.
    const errorMessages: Record<string, string> = {
      ResourceNotFoundException: 'Recurso não encontrado', // Erro indicando que a tabela ou item especificado não existe.
      ProvisionedThroughputExceededException: 'Limite de capacidade excedido', // Erro quando a taxa de requisições excede a capacidade provisionada da tabela.
      ConditionalCheckFailedException: 'Condição de escrita não satisfeita', // Erro em operações condicionais (ex: UpdateItem com ConditionExpression) quando a condição falha.
      TransactionConflictException: 'Conflito em transação', // Erro indicando conflito durante operações de transação, geralmente devido a concorrência.
      // Você pode adicionar mais mapeamentos de erros específicos conforme necessário.
      // Consulte a documentação do AWS SDK para DynamoDB para mais tipos de erros e suas causas.
    };

    // Retorna a mensagem de erro mapeada em português se o nome do erro original estiver no mapeamento `errorMessages`.
    // Se não houver mapeamento para o erro específico, retorna uma mensagem genérica que inclui a operação e a mensagem de erro original.
    return (
      errorMessages[error.name] ||
      `Erro na operação ${operation}: ${error.message}` // Mensagem genérica para erros não mapeados, útil para diagnóstico.
    );
  }
}
