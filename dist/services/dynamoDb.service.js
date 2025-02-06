"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
// src/services/dynamoDb.service.ts
const common_1 = require("@nestjs/common");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
let DynamoDbService = DynamoDbService_1 = class DynamoDbService {
    constructor() {
        this.logger = new common_1.Logger(DynamoDbService_1.name);
        const clientConfig = Object.assign({ region: process.env.AWS_REGION || 'us-east-1' }, (process.env.LOCAL_DYNAMO_ENDPOINT && {
            endpoint: process.env.LOCAL_DYNAMO_ENDPOINT,
        }));
        const translateConfig = {
            marshallOptions: {
                removeUndefinedValues: true,
                convertClassInstanceToMap: true,
                convertEmptyValues: false,
            },
            unmarshallOptions: {
                wrapNumbers: false,
            },
        };
        this.docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(new client_dynamodb_1.DynamoDBClient(clientConfig), translateConfig);
    }
    getItem(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.docClient.send(new GetCommand(params));
            }
            catch (error) {
                this.handleError(error, 'getItem');
            }
        });
    }
    putItem(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.docClient.send(new PutCommand(params));
            }
            catch (error) {
                this.handleError(error, 'putItem');
            }
        });
    }
    updateItem(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.docClient.send(new UpdateCommand(params));
            }
            catch (error) {
                this.handleError(error, 'updateItem');
            }
        });
    }
    deleteItem(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.docClient.send(new DeleteCommand(params));
            }
            catch (error) {
                this.handleError(error, 'deleteItem');
            }
        });
    }
    scanItems(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.docClient.send(new ScanCommand(params));
            }
            catch (error) {
                this.handleError(error, 'scanItems');
            }
        });
    }
    queryItems(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.docClient.send(new QueryCommand(params));
            }
            catch (error) {
                this.handleError(error, 'queryItems');
            }
        });
    }
    batchWrite(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.docClient.send(new BatchWriteCommand(params));
            }
            catch (error) {
                this.handleError(error, 'batchWrite');
            }
        });
    }
    batchGet(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.docClient.send(new BatchGetCommand(params));
            }
            catch (error) {
                this.handleError(error, 'batchGet');
            }
        });
    }
    handleError(error, operation) {
        this.logger.error(`DynamoDB Error (${operation}): ${error.message}`, error.stack);
        throw new Error(this.mapErrorMessage(error, operation));
    }
    mapErrorMessage(error, operation) {
        const errorMessages = {
            ResourceNotFoundException: 'Recurso não encontrado',
            ProvisionedThroughputExceededException: 'Limite de capacidade excedido',
            ConditionalCheckFailedException: 'Condição de escrita não satisfeita',
            TransactionConflictException: 'Conflito em transação',
        };
        return errorMessages[error.name] || `Erro na operação ${operation}: ${error.message}`;
    }
    buildUpdateExpression(input, excludeKeys = []) {
        const updateKeys = Object.keys(input)
            .filter(key => !excludeKeys.includes(key))
            .filter(key => input[key] !== undefined);
        if (updateKeys.length === 0)
            return null;
        const UpdateExpression = `SET ${updateKeys
            .map((key, index) => `#field${index} = :value${index}`)
            .join(', ')}`;
        const ExpressionAttributeNames = updateKeys.reduce((acc, key, index) => (Object.assign(Object.assign({}, acc), { [`#field${index}`]: key })), {});
        const ExpressionAttributeValues = updateKeys.reduce((acc, key, index) => (Object.assign(Object.assign({}, acc), { [`:value${index}`]: input[key] })), {});
        return {
            UpdateExpression,
            ExpressionAttributeNames,
            ExpressionAttributeValues,
        };
    }
};
exports.DynamoDbService = DynamoDbService;
exports.DynamoDbService = DynamoDbService = DynamoDbService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], DynamoDbService);
