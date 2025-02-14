"use strict";
// src/modules/blog/posts/services/posts.service.ts
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
const common_1 = require("@nestjs/common");
const dynamoDb_service_1 = require("../../../../services/dynamoDb.service");
let PostsService = class PostsService {
    constructor(dynamoDbService) {
        this.dynamoDbService = dynamoDbService;
        this.tableName = 'Posts';
    }
    create(createPostDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const categorySubcategoryId = `${createPostDto.categoryId}#${createPostDto.subcategoryId}`;
            const postId = this.generatePostId(); // Gere um postId único aqui (ex: UUID)
            const params = {
                TableName: this.tableName,
                Item: Object.assign(Object.assign({}, createPostDto), { 'categoryId#subcategoryId': categorySubcategoryId, postId: postId }),
            };
            yield this.dynamoDbService.putItem(params);
            return this.findOne(categorySubcategoryId, postId);
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
    findOne(categoryIdSubcategoryId, postId) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                TableName: this.tableName,
                Key: {
                    'categoryId#subcategoryId': { S: categoryIdSubcategoryId },
                    postId: { S: postId },
                },
            };
            const result = yield this.dynamoDbService.getItem(params);
            if (!result.Item) {
                throw new common_1.NotFoundException(`Post com categoryId#subcategoryId '${categoryIdSubcategoryId}' e postId '${postId}' não encontrado`);
            }
            return result.Item;
        });
    }
    update(categoryIdSubcategoryId, postId, updatePostDto) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.findOne(categoryIdSubcategoryId, postId);
            const updateExpression = this.dynamoDbService.buildUpdateExpression(updatePostDto);
            if (!updateExpression) {
                return this.findOne(categoryIdSubcategoryId, postId);
            }
            const params = Object.assign(Object.assign({ TableName: this.tableName, Key: {
                    'categoryId#subcategoryId': { S: categoryIdSubcategoryId },
                    postId: { S: postId },
                } }, updateExpression), { ReturnValues: 'ALL_NEW' });
            const result = yield this.dynamoDbService.updateItem(params);
            return result.Attributes;
        });
    }
    remove(categoryIdSubcategoryId, postId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.findOne(categoryIdSubcategoryId, postId);
            const params = {
                TableName: this.tableName,
                Key: {
                    'categoryId#subcategoryId': { S: categoryIdSubcategoryId },
                    postId: { S: postId },
                },
            };
            yield this.dynamoDbService.deleteItem(params);
        });
    }
    generatePostId() {
        // Implemente sua lógica para gerar um PostId único (ex: UUID, nanoid, etc.)
        // Para simplificar, um exemplo básico com timestamp e random:
        return `mbx9zi-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dynamoDb_service_1.DynamoDbService])
], PostsService);
