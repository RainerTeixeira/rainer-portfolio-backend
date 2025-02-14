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
const common_1 = require("@nestjs/common"); // Importa Injectable e NotFoundException do NestJS.
const dynamoDb_service_1 = require("../../../../services/dynamoDb.service"); // Importa DynamoDbService usando alias @src.
let CommentsService = class CommentsService {
    constructor(dynamoDbService) {
        this.dynamoDbService = dynamoDbService;
        this.tableName = 'Comments';
    }
    create(createCommentDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                TableName: this.tableName,
                Item: createCommentDto,
            };
            yield this.dynamoDbService.putItem(params);
            return this.findOne(createCommentDto.postId.toString(), createCommentDto.authorId); // postId é Number no DTO, mas String na chave do DynamoDB
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                TableName: this.tableName,
            };
            const result = yield this.dynamoDbService.scanItems(params);
            return result.Items || [];
        });
    }
    findOne(postId, authorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                TableName: this.tableName,
                Key: {
                    postId: { N: postId }, // postId como Number
                    authorId: { S: authorId },
                },
            };
            const result = yield this.dynamoDbService.getItem(params);
            if (!result.Item) {
                throw new common_1.NotFoundException(`Comment com postId '${postId}' e authorId '${authorId}' não encontrado`);
            }
            return result.Item;
        });
    }
    update(postId, authorId, updateCommentDto) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.findOne(postId, authorId);
            const updateExpression = this.dynamoDbService.buildUpdateExpression(updateCommentDto);
            if (!updateExpression) {
                return this.findOne(postId, authorId);
            }
            const params = Object.assign(Object.assign({ TableName: this.tableName, Key: {
                    postId: { N: postId },
                    authorId: { S: authorId },
                } }, updateExpression), { ReturnValues: 'ALL_NEW' });
            const result = yield this.dynamoDbService.updateItem(params);
            return result.Attributes;
        });
    }
    remove(postId, authorId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.findOne(postId, authorId);
            const params = {
                TableName: this.tableName,
                Key: {
                    postId: { N: postId },
                    authorId: { S: authorId },
                },
            };
            yield this.dynamoDbService.deleteItem(params);
        });
    }
};
exports.CommentsService = CommentsService;
exports.CommentsService = CommentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dynamoDb_service_1.DynamoDbService])
], CommentsService);
