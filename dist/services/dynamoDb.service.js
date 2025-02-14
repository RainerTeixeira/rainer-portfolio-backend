"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var DynamoDbService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDbService = void 0;
const common_1 = require("@nestjs/common");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dotenv = __importStar(require("dotenv")); // Importa dotenv para carregar variáveis do .env
dotenv.config(); // Carrega as variáveis de ambiente do .env para o process.env
let DynamoDbService = DynamoDbService_1 = class DynamoDbService {
    constructor() {
        this.logger = new common_1.Logger(DynamoDbService_1.name); // Logger para registrar mensagens do serviço
        // Configuração do cliente DynamoDB (AWS SDK v3)
        const clientConfig = Object.assign({ region: process.env.AWS_REGION || 'us-east-1' }, (process.env.LOCAL_DYNAMO_ENDPOINT && {
            endpoint: process.env.LOCAL_DYNAMO_ENDPOINT,
        }));
        // Configuração de tradução para o Document Client (facilita trabalhar com objetos JavaScript)
        const translateConfig = {
            marshallOptions: {
                removeUndefinedValues: true, // Remove valores undefined ao converter objetos JavaScript para o formato DynamoDB
                convertClassInstanceToMap: true, // Converte instâncias de classes para mapas (objetos)
                convertEmptyValues: false, // Não converte strings vazias, números zero, etc. para tipos vazios do DynamoDB
            },
            unmarshallOptions: {
                wrapNumbers: false, // Não envolve números em objetos Number ao converter do formato DynamoDB para JavaScript
            },
        };
        // Cria o Document Client a partir do cliente DynamoDB e configuração de tradução
        this.docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(new client_dynamodb_1.DynamoDBClient(clientConfig), translateConfig);
        this.logger.log('DynamoDB DocumentClient inicializado usando variáveis de ambiente'); // Loga que o cliente foi inicializado
    }
    // Método para buscar um item do DynamoDB por chave primária (GetItem)
    getItem(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const command = new client_dynamodb_1.GetItemCommand(params); // Cria o comando GetItem
                return yield this.docClient.send(command); // Envia o comando para o DynamoDB e retorna a resposta
            }
            catch (error) {
                this.handleError(error, 'getItem'); // Em caso de erro, trata o erro
            }
        });
    }
    // Método para criar ou substituir um item no DynamoDB (PutItem)
    putItem(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const command = new client_dynamodb_1.PutItemCommand(params); // Cria o comando PutItem
                return yield this.docClient.send(command); // Envia o comando para o DynamoDB e retorna a resposta
            }
            catch (error) {
                this.handleError(error, 'putItem'); // Em caso de erro, trata o erro
            }
        });
    }
    // Método para atualizar um item existente no DynamoDB (UpdateItem)
    updateItem(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const command = new client_dynamodb_1.UpdateItemCommand(params); // Cria o comando UpdateItem
                return yield this.docClient.send(command); // Envia o comando para o DynamoDB e retorna a resposta
            }
            catch (error) {
                this.handleError(error, 'updateItem'); // Em caso de erro, trata o erro
            }
        });
    }
    // Método para deletar um item do DynamoDB (DeleteItem)
    deleteItem(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const command = new client_dynamodb_1.DeleteItemCommand(params); // Cria o comando DeleteItem
                return yield this.docClient.send(command); // Envia o comando para o DynamoDB e retorna a resposta
            }
            catch (error) {
                this.handleError(error, 'deleteItem'); // Em caso de erro, trata o erro
            }
        });
    }
    // Método para escanear uma tabela inteira do DynamoDB (Scan) - CUIDADO: Ineficiente para tabelas grandes em produção
    scan(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const command = new client_dynamodb_1.ScanCommand(params); // Cria o comando Scan
                return yield this.docClient.send(command); // Envia o comando para o DynamoDB e retorna a resposta
            }
            catch (error) {
                this.handleError(error, 'scan'); // Correção: Renomeado para scan
            }
        });
    }
    // Método para consultar itens do DynamoDB usando chave de partição e, opcionalmente, chave de classificação (Query) - Mais eficiente que Scan para consultas específicas
    queryItems(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const command = new client_dynamodb_1.QueryCommand(params); // Cria o comando Query
                return yield this.docClient.send(command); // Envia o comando para o DynamoDB e retorna a resposta
            }
            catch (error) {
                this.handleError(error, 'queryItems'); // Em caso de erro, trata o erro
            }
        });
    }
    // Método para realizar operações de escrita em lote no DynamoDB (BatchWriteItem) - Para criar ou deletar múltiplos itens eficientemente
    batchWrite(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const command = new client_dynamodb_1.BatchWriteItemCommand(params); // Correção: BatchWriteItemCommand // Cria o comando BatchWriteItem
                return yield this.docClient.send(command); // Envia o comando para o DynamoDB e retorna a resposta
            }
            catch (error) {
                this.handleError(error, 'batchWrite'); // Em caso de erro, trata o erro
            }
        });
    }
    // Método para realizar operações de leitura em lote no DynamoDB (BatchGetItem) - Para buscar múltiplos itens eficientemente
    batchGet(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const command = new client_dynamodb_1.BatchGetItemCommand(params); // Cria o comando BatchGetItem
                return yield this.docClient.send(command); // Envia o comando para o DynamoDB e retorna a resposta
            }
            catch (error) {
                this.handleError(error, 'batchGet'); // Em caso de erro, trata o erro
            }
        });
    }
    // Método utilitário para construir expressões de atualização (UpdateExpression) dinamicamente
    // Útil para atualizar apenas os campos que foram modificados em um item
    buildUpdateExpression(input, // Objeto com os campos a serem atualizados (chave: nome do atributo, valor: novo valor)
    excludeKeys = [] // Array de chaves a serem excluídas da atualização (opcional)
    ) {
        const updateKeys = Object.keys(input) // Obtém as chaves do objeto de entrada
            .filter((key) => !excludeKeys.includes(key)) // Filtra chaves excluídas
            .filter((key) => input[key] !== undefined); // Filtra chaves com valor undefined
        if (updateKeys.length === 0)
            return null; // Se não houver chaves para atualizar, retorna null
        // Constrói a UpdateExpression usando placeholders #field e :value para evitar palavras reservadas e injeção de valores
        const UpdateExpression = `SET ${updateKeys
            .map((key, index) => `#field${index} = :value${index}`) // Cria '#field0 = :value0, #field1 = :value1, ...'
            .join(', ')}`; // Junta as partes da expressão com vírgula e espaço
        // Constrói ExpressionAttributeNames para mapear placeholders #field para nomes de atributos reais
        const ExpressionAttributeNames = updateKeys.reduce((acc, key, index) => (Object.assign(Object.assign({}, acc), { [`#field${index}`]: key })), {});
        // Constrói ExpressionAttributeValues para mapear placeholders :value para os valores dos atributos
        const ExpressionAttributeValues = updateKeys.reduce((acc, key, index) => (Object.assign(Object.assign({}, acc), { [`:value${index}`]: input[key] })), {});
        // Retorna o objeto com UpdateExpression, ExpressionAttributeNames e ExpressionAttributeValues
        return {
            UpdateExpression,
            ExpressionAttributeNames,
            ExpressionAttributeValues,
        };
    }
    // Método privado para tratar erros do DynamoDB
    handleError(error, operation) {
        this.logger.error(`Erro do DynamoDB (${operation}): ${error.message}`, // Loga o erro com a operação e mensagem
        error.stack // Loga o stacktrace do erro para debugging
        );
        // Mapeia mensagens de erro conhecidas para mensagens mais amigáveis em português
        const mappedError = new Error(this.mapErrorMessage(error, operation));
        mappedError.name = error.name || 'DynamoDBError'; // Mantém o nome original do erro ou usa 'DynamoDBError' como fallback
        throw mappedError; // Lança o erro tratado para que o NestJS possa lidar (ex: retornar 500 Internal Server Error)
    }
    // Método privado para mapear mensagens de erro do DynamoDB para português
    mapErrorMessage(error, operation) {
        const errorMessages = {
            ResourceNotFoundException: 'Recurso não encontrado', // Erro quando a tabela ou item não existe
            ProvisionedThroughputExceededException: 'Limite de capacidade excedido', // Erro quando a capacidade provisionada da tabela é excedida
            ConditionalCheckFailedException: 'Condição de escrita não satisfeita', // Erro em operações condicionais (ex: Update com ConditionExpression)
            TransactionConflictException: 'Conflito em transação', // Erro em transações concorrentes
        };
        // Retorna a mensagem mapeada em português se existir, senão retorna uma mensagem genérica com a mensagem original
        return (errorMessages[error.name] ||
            `Erro na operação ${operation}: ${error.message}`);
    }
};
exports.DynamoDbService = DynamoDbService;
exports.DynamoDbService = DynamoDbService = DynamoDbService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], DynamoDbService);
