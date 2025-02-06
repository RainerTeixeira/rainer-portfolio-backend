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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsService = void 0;
// src/modules/blog/posts/posts.service.ts
const common_1 = require("@nestjs/common");
const dynamoDb_service_1 = require("../../../services/dynamoDb.service");
let PostsService = class PostsService {
    constructor(dynamoDb) {
        this.dynamoDb = dynamoDb;
        this.tableName = process.env.DYNAMO_TABLE_NAME_POSTS;
    }
    create(createPostDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = Object.assign(Object.assign({}, createPostDto), { postId: this.generatePostId(), postDate: new Date().toISOString(), postLastUpdated: new Date().toISOString() });
            yield this.dynamoDb.putItem({
                TableName: this.tableName,
                Item: post,
                ConditionExpression: 'attribute_not_exists(postId)',
            });
            return post;
        });
    }
    findAll(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const limit = Math.min(Number(query.limit) || 20, 100);
            const ExclusiveStartKey = this.decodeCursor(query.lastKey);
            const result = yield this.dynamoDb.scanItems({
                TableName: this.tableName,
                Limit: limit,
                ExclusiveStartKey,
                ConsistentRead: false,
            });
            return this.formatPaginatedResult(result.Items, result.LastEvaluatedKey);
        });
    }
    findOne(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.dynamoDb.getItem({
                TableName: this.tableName,
                Key: { postId: id },
                ConsistentRead: true,
            });
            if (!result.Item) {
                throw new common_1.NotFoundException('Post não encontrado');
            }
            return result.Item;
        });
    }
    update(id, updatePostDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const updateParams = this.dynamoDb.buildUpdateExpression(updatePostDto, ['postId']);
            if (!updateParams) {
                throw new common_1.BadRequestException('Nenhum campo válido para atualização');
            }
            const result = yield this.dynamoDb.updateItem(Object.assign(Object.assign({ TableName: this.tableName, Key: { postId: id } }, updateParams), { UpdateExpression: `${updateParams.UpdateExpression}, postLastUpdated = :updatedAt`, ExpressionAttributeValues: Object.assign(Object.assign({}, updateParams.ExpressionAttributeValues), { ':updatedAt': new Date().toISOString() }), ReturnValues: 'ALL_NEW', ConditionExpression: 'attribute_exists(postId)' }));
            return result.Attributes;
        });
    }
    remove(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dynamoDb.deleteItem({
                TableName: this.tableName,
                Key: { postId: id },
                ConditionExpression: 'attribute_exists(postId)',
            });
            return { success: true, message: 'Post excluído com sucesso' };
        });
    }
    generatePostId() {
        return Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
    }
    decodeCursor(cursor) {
        try {
            return cursor ? JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8')) : undefined;
        }
        catch (_a) {
            return undefined;
        }
    }
    formatPaginatedResult(items, lastKey) {
        return {
            data: items || [],
            meta: {
                count: (items === null || items === void 0 ? void 0 : items.length) || 0,
                nextCursor: lastKey
                    ? Buffer.from(JSON.stringify(lastKey)).toString('base64')
                    : null,
            },
        };
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dynamoDb_service_1.DynamoDbService])
], PostsService);
