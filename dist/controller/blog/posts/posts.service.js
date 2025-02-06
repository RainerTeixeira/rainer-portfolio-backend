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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
let PostsService = class PostsService {
    constructor(dynamoDBClient) {
        this.dynamoDBClient = dynamoDBClient;
        this.tableName = process.env.DYNAMO_TABLE_NAME_POSTS;
        this.docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(this.dynamoDBClient, {
            marshallOptions: { removeUndefinedValues: true },
            unmarshallOptions: { wrapNumbers: false },
        });
    }
    handleDynamoError(error, context) {
        console.error(`Erro no DynamoDB (${context}):`, error);
        throw new common_1.BadRequestException(`Falha ao ${context}`);
    }
    create(createPostDto) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const post = Object.assign(Object.assign({ postId: Date.now().toString() }, createPostDto), { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
                yield this.docClient.send(new lib_dynamodb_1.PutCommand({
                    TableName: this.tableName,
                    Item: post,
                }));
                return post;
            }
            catch (error) {
                this.handleDynamoError(error, 'criar post');
            }
        });
    }
    findAll(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const limit = Math.min(Number(query.limit) || 20, 100);
                const ExclusiveStartKey = query.lastKey
                    ? JSON.parse(Buffer.from(query.lastKey, 'base64').toString('utf-8'))
                    : undefined;
                const { Items, LastEvaluatedKey } = yield this.docClient.send(new lib_dynamodb_1.ScanCommand({
                    TableName: this.tableName,
                    Limit: limit,
                    ExclusiveStartKey,
                }));
                return {
                    data: Items || [],
                    meta: {
                        count: (Items === null || Items === void 0 ? void 0 : Items.length) || 0,
                        nextCursor: LastEvaluatedKey
                            ? Buffer.from(JSON.stringify(LastEvaluatedKey)).toString('base64')
                            : null,
                    },
                };
            }
            catch (error) {
                this.handleDynamoError(error, 'buscar posts');
            }
        });
    }
    findOne(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { Item } = yield this.docClient.send(new lib_dynamodb_1.GetCommand({
                    TableName: this.tableName,
                    Key: { postId: id },
                }));
                if (!Item) {
                    throw new common_1.NotFoundException('Post não encontrado');
                }
                return Item;
            }
            catch (error) {
                if (error instanceof common_1.NotFoundException)
                    throw error;
                this.handleDynamoError(error, 'buscar post');
            }
        });
    }
    update(id, updatePostDto) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const updateKeys = Object.keys(updatePostDto);
                if (updateKeys.length === 0) {
                    throw new common_1.BadRequestException('Nenhum campo fornecido para atualização');
                }
                const updateExpressions = updateKeys
                    .map((_, index) => `#field${index} = :value${index}`)
                    .join(', ');
                const expressionAttributeNames = updateKeys.reduce((acc, key, index) => (Object.assign(Object.assign({}, acc), { [`#field${index}`]: key })), {});
                const expressionAttributeValues = updateKeys.reduce((acc, key, index) => (Object.assign(Object.assign({}, acc), { [`:value${index}`]: updatePostDto[key] })), // Evitar uso de any
                {});
                const { Attributes } = yield this.docClient.send(new lib_dynamodb_1.UpdateCommand({
                    TableName: this.tableName,
                    Key: { postId: id },
                    UpdateExpression: `SET ${updateExpressions}, updatedAt = :updatedAt`,
                    ExpressionAttributeNames: expressionAttributeNames,
                    ExpressionAttributeValues: Object.assign(Object.assign({}, expressionAttributeValues), { ':updatedAt': new Date().toISOString() }),
                    ReturnValues: 'ALL_NEW',
                }));
                if (!Attributes) {
                    throw new common_1.NotFoundException('Post não encontrado para atualização');
                }
                return Attributes;
            }
            catch (error) {
                if (error instanceof common_1.NotFoundException)
                    throw error;
                this.handleDynamoError(error, 'atualizar post');
            }
        });
    }
    remove(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.docClient.send(new lib_dynamodb_1.DeleteCommand({
                    TableName: this.tableName,
                    Key: { postId: id },
                }));
                return { success: true, message: 'Post excluído com sucesso' };
            }
            catch (error) {
                this.handleDynamoError(error, 'excluir post');
            }
        });
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_2.Inject)('DYNAMODB_CLIENT')),
    __metadata("design:paramtypes", [client_dynamodb_1.DynamoDBClient])
], PostsService);
