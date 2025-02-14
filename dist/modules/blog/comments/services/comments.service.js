"use strict";
// src/modules/blog/comments/services/comments.service.ts
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentsService = void 0;
const common_1 = require("@nestjs/common");
const dynamoDb_service_1 = require("../../../../services/dynamoDb.service"); // Importa DynamoDbService usando alias @src.
let CommentsService = class CommentsService {
    constructor(dynamoDbService) {
        this.dynamoDbService = dynamoDbService;
        this.tableName = 'Comments'; // Nome da tabela DynamoDB para Comments
    } // Injeta DynamoDbService
    create(createCommentDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                TableName: this.tableName,
                Item: createCommentDto,
            };
            yield this.dynamoDbService.putItem(params);
            return this.findOne(createCommentDto.postId, createCommentDto.authorId);
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.dynamoDbService.scan({ TableName: this.tableName });
            return (result.Items || []).map(item => this.mapCommentFromDynamoDb(item));
        });
    }
    findOne(postId, authorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                TableName: this.tableName,
                Key: {
                    postId: { N: postId.toString() }, // postId como Number (convertido para String ao usar como Key no DynamoDB)
                    authorId: { S: authorId }, // authorId como String
                },
            };
            const result = yield this.dynamoDbService.getItem(params);
            if (!result.Item) {
                throw new common_1.NotFoundException(`Comment com postId '<span class="math-inline">\{postId\}' e authorId '</span>{authorId}' não encontrado`);
            }
            return this.mapCommentFromDynamoDb(result.Item);
        });
    }
    update(postId, authorId, updateCommentDto) {
        return __awaiter(this, void 0, void 0, function* () {
            // Verifica se o comentário existe antes de atualizar
            yield this.findOne(postId, authorId);
            const params = {
                TableName: this.tableName,
                Key: {
                    postId: { N: postId.toString() }, // postId como Number (convertido para String ao usar como Key no DynamoDB)
                    authorId: { S: authorId },
                },
                UpdateExpression: 'SET content = :content, #status = :status, #date = :date', // Use 'SET' e placeholders para atualizar
                ExpressionAttributeNames: {
                    '#status': 'status', // '#status' será substituído por 'status' (evita palavras reservadas)
                    '#date': 'date', // '#date' será substituído por 'date' (evita palavras reservadas)
                },
                ExpressionAttributeValues: {
                    ':content': { S: updateCommentDto.content }, // Formato correto do valor string para DynamoDB
                    ':status': { S: updateCommentDto.status || 'pending' }, // Valor padrão 'pending' se status não for fornecido
                    ':date': { S: updateCommentDto.date || new Date().toISOString() }, // Valor padrão data atual se não fornecido
                },
                ReturnValues: 'ALL_NEW', // Defina o tipo de retorno esperado
            };
            const result = yield this.dynamoDbService.updateItem(params);
            return this.mapCommentFromDynamoDb(result.Attributes);
        });
    }
    remove(postId, authorId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Verifica se o comentário existe antes de deletar
            yield this.findOne(postId, authorId);
            const params = {
                TableName: this.tableName,
                Key: {
                    postId: { N: postId.toString() }, // postId como Number (convertido para String ao usar como Key no DynamoDB)
                    authorId: { S: authorId },
                },
            };
            yield this.dynamoDbService.deleteItem(params);
        });
    }
    mapCommentFromDynamoDb(item) {
        var _a, _b, _c, _d, _e;
        return {
            postId: Number((_a = item.postId) === null || _a === void 0 ? void 0 : _a.N), // Converte de volta para Number ao mapear do DynamoDB
            authorId: (_b = item.authorId) === null || _b === void 0 ? void 0 : _b.S,
            content: (_c = item.content) === null || _c === void 0 ? void 0 : _c.S,
            date: (_d = item.date) === null || _d === void 0 ? void 0 : _d.S,
            status: (_e = item.status) === null || _e === void 0 ? void 0 : _e.S,
        };
    }
};
exports.CommentsService = CommentsService;
exports.CommentsService = CommentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dynamoDb_service_1.DynamoDbService])
], CommentsService);
