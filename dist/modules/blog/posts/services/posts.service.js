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
const dynamoDb_service_1 = require("../../../../services/dynamoDb.service"); // Importa DynamoDbService usando alias @src.
let PostsService = class PostsService {
    constructor(dynamoDbService) {
        this.dynamoDbService = dynamoDbService;
        this.tableName = 'Posts'; // Nome da tabela DynamoDB para Posts
    } // Injeta DynamoDbService
    create(createPostDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                TableName: this.tableName,
                Item: createPostDto,
            };
            yield this.dynamoDbService.putItem(params);
            return this.findOne(createPostDto.categoryId + '#' + createPostDto.subcategoryId, createPostDto.postId);
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.dynamoDbService.scan({ TableName: this.tableName });
            return (result.Items || []).map(item => this.mapPostFromDynamoDb(item));
        });
    }
    findOne(categoryIdSubcategoryId, postId) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                TableName: this.tableName,
                Key: {
                    'categoryId#subcategoryId': { S: categoryIdSubcategoryId }, // Chave composta
                    postId: { S: postId },
                },
            };
            const result = yield this.dynamoDbService.getItem(params);
            if (!result.Item) {
                throw new common_1.NotFoundException(`Post com ID '<span class="math-inline">\{postId\}' na categoria '</span>{categoryIdSubcategoryId}' não encontrado`);
            }
            return this.mapPostFromDynamoDb(result.Item);
        });
    }
    update(categoryIdSubcategoryId, postId, updatePostDto) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g;
            // Verifica se o post existe antes de atualizar
            yield this.findOne(categoryIdSubcategoryId, postId);
            const params = {
                TableName: this.tableName,
                Key: {
                    'categoryId#subcategoryId': { S: categoryIdSubcategoryId }, // Chave composta
                    postId: { S: postId },
                },
                UpdateExpression: 'SET contentHTML = :contentHTML, excerpt = :excerpt, publishDate = :publishDate, slug = :slug, title = :title, postInfo = :postInfo, seo = :seo, #status = :status', // UpdateExpression
                ExpressionAttributeNames: {
                    '#status': 'status', // Para 'status' (palavra reservada)
                },
                ExpressionAttributeValues: {
                    ':contentHTML': { S: updatePostDto.contentHTML },
                    ':excerpt': { S: updatePostDto.excerpt },
                    ':publishDate': { S: updatePostDto.publishDate },
                    ':slug': { S: updatePostDto.slug },
                    ':title': { S: updatePostDto.title },
                    ':postInfo': {
                        M: {
                            authorId: { S: ((_a = updatePostDto.postInfo) === null || _a === void 0 ? void 0 : _a.authorId) || null },
                            tags: { L: ((_c = (_b = updatePostDto.postInfo) === null || _b === void 0 ? void 0 : _b.tags) === null || _c === void 0 ? void 0 : _c.map(tag => ({ S: tag }))) || [] },
                        }
                    },
                    ':seo': {
                        M: {
                            canonical: { S: ((_d = updatePostDto.seo) === null || _d === void 0 ? void 0 : _d.canonical) || null },
                            description: { S: ((_e = updatePostDto.seo) === null || _e === void 0 ? void 0 : _e.description) || null },
                            keywords: { L: ((_g = (_f = updatePostDto.seo) === null || _f === void 0 ? void 0 : _f.keywords) === null || _g === void 0 ? void 0 : _g.map(keyword => ({ S: keyword }))) || [] },
                        }
                    },
                    ':status': { S: updatePostDto.status || 'draft' }, // Valor padrão 'draft' para status
                },
                ReturnValues: 'ALL_NEW',
            };
            const result = yield this.dynamoDbService.updateItem(params);
            return this.mapPostFromDynamoDb(result.Attributes);
        });
    }
    remove(categoryIdSubcategoryId, postId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Verifica se o post existe antes de deletar
            yield this.findOne(categoryIdSubcategoryId, postId);
            const params = {
                TableName: this.tableName,
                Key: {
                    'categoryId#subcategoryId': { S: categoryIdSubcategoryId }, // Chave composta
                    postId: { S: postId },
                },
            };
            yield this.dynamoDbService.deleteItem(params);
        });
    }
    mapPostFromDynamoDb(item) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8;
        return {
            'categoryId#subcategoryId': (_a = item['categoryId#subcategoryId']) === null || _a === void 0 ? void 0 : _a.S, // Acessa chave composta usando index signature
            postId: (_b = item.postId) === null || _b === void 0 ? void 0 : _b.S,
            categoryId: (_c = item.categoryId) === null || _c === void 0 ? void 0 : _c.S,
            subcategoryId: (_d = item.subcategoryId) === null || _d === void 0 ? void 0 : _d.S,
            contentHTML: (_e = item.contentHTML) === null || _e === void 0 ? void 0 : _e.S,
            postInfo: {
                authorId: (_h = (_g = (_f = item.postInfo) === null || _f === void 0 ? void 0 : _f.M) === null || _g === void 0 ? void 0 : _g.authorId) === null || _h === void 0 ? void 0 : _h.S,
                tags: ((_m = (_l = (_k = (_j = item.postInfo) === null || _j === void 0 ? void 0 : _j.M) === null || _k === void 0 ? void 0 : _k.tags) === null || _l === void 0 ? void 0 : _l.L) === null || _m === void 0 ? void 0 : _m.map((tagItem) => tagItem.S)) || [],
                likes: Number((_q = (_p = (_o = item.postInfo) === null || _o === void 0 ? void 0 : _o.M) === null || _p === void 0 ? void 0 : _p.likes) === null || _q === void 0 ? void 0 : _q.N),
                views: Number((_t = (_s = (_r = item.postInfo) === null || _r === void 0 ? void 0 : _r.M) === null || _s === void 0 ? void 0 : _s.views) === null || _t === void 0 ? void 0 : _t.N),
            },
            excerpt: (_u = item.excerpt) === null || _u === void 0 ? void 0 : _u.S,
            publishDate: (_v = item.publishDate) === null || _v === void 0 ? void 0 : _v.S,
            slug: (_w = item.slug) === null || _w === void 0 ? void 0 : _w.S,
            title: (_x = item.title) === null || _x === void 0 ? void 0 : _x.S,
            status: (_y = item.status) === null || _y === void 0 ? void 0 : _y.S,
            seo: {
                canonical: (_1 = (_0 = (_z = item.seo) === null || _z === void 0 ? void 0 : _z.M) === null || _0 === void 0 ? void 0 : _0.canonical) === null || _1 === void 0 ? void 0 : _1.S,
                description: (_4 = (_3 = (_2 = item.seo) === null || _2 === void 0 ? void 0 : _2.M) === null || _3 === void 0 ? void 0 : _3.description) === null || _4 === void 0 ? void 0 : _4.S,
                keywords: ((_8 = (_7 = (_6 = (_5 = item.seo) === null || _5 === void 0 ? void 0 : _5.M) === null || _6 === void 0 ? void 0 : _6.keywords) === null || _7 === void 0 ? void 0 : _7.L) === null || _8 === void 0 ? void 0 : _8.map((keywordItem) => keywordItem.S)) || []
            },
        };
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dynamoDb_service_1.DynamoDbService])
], PostsService);
