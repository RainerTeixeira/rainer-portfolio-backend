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
// src/modules/blog/posts/services/posts.service.ts
const common_1 = require("@nestjs/common");
const aws_sdk_1 = require("aws-sdk");
const uuid_1 = require("uuid");
let PostsService = class PostsService {
    constructor() {
        this.tableName = 'Posts';
        this.dynamoDb = new aws_sdk_1.DynamoDB.DocumentClient({ region: 'us-east-1' }); // ajuste a região se necessário
    }
    createPost(categoryIdSubcategoryId, createPostDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const postId = (0, uuid_1.v4)();
            const params = {
                TableName: this.tableName,
                Item: {
                    'categoryId#subcategoryId': categoryIdSubcategoryId, // Chave de Partição Composta
                    postId: postId, // Chave de Classificação
                    categoryId: createPostDto.categoryId,
                    subcategoryId: createPostDto.subcategoryId,
                    contentHTML: createPostDto.contentHTML,
                    postInfo: createPostDto.postInfo,
                    seo: createPostDto.seo,
                },
            };
            yield this.dynamoDb.put(params).promise();
            return Object.assign({}, params.Item); // Retorna o item criado como PostDto
        });
    }
    getPostById(categoryIdSubcategoryId, postId) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                TableName: this.tableName,
                Key: {
                    'categoryId#subcategoryId': categoryIdSubcategoryId,
                    postId: postId,
                },
            };
            const result = yield this.dynamoDb.get(params).promise();
            if (!result.Item) {
                throw new common_1.NotFoundException(`Post com ID '${postId}' na categoria '${categoryIdSubcategoryId}' não encontrado`);
            }
            return result.Item;
        });
    }
    updatePost(categoryIdSubcategoryId, postId, updatePostDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                TableName: this.tableName,
                Key: {
                    'categoryId#subcategoryId': categoryIdSubcategoryId,
                    postId: postId,
                },
                UpdateExpression: 'set #contentHTML = :contentHTML, #postInfo = :postInfo, #seo = :seo, categoryId = :categoryId, subcategoryId = :subcategoryId', // Corrigido UpdateExpression
                ExpressionAttributeNames: {
                    '#contentHTML': 'contentHTML',
                    '#postInfo': 'postInfo',
                    '#seo': 'seo',
                },
                ExpressionAttributeValues: {
                    ':contentHTML': updatePostDto.contentHTML,
                    ':postInfo': updatePostDto.postInfo,
                    ':seo': updatePostDto.seo,
                    ':categoryId': updatePostDto.categoryId, // Adicionado categoryId
                    ':subcategoryId': updatePostDto.subcategoryId, // Adicionado subcategoryId
                },
                ReturnValues: 'ALL_NEW',
            };
            const result = yield this.dynamoDb.update(params).promise();
            return result.Attributes;
        });
    }
    deletePost(categoryIdSubcategoryId, postId) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                TableName: this.tableName,
                Key: {
                    'categoryId#subcategoryId': categoryIdSubcategoryId,
                    postId: postId,
                },
            };
            yield this.dynamoDb.delete(params).promise();
        });
    }
    getAllPosts() {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                TableName: this.tableName,
                // IndexName: 'PostsIndex', // Se você tiver um GSI para consulta por todos os posts, descomente e use o nome do índice
            };
            const result = yield this.dynamoDb.scan(params).promise(); // ou query se usar GSI
            return result.Items.map(item => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10;
                return {
                    'categoryId#subcategoryId': (_a = item['categoryId#subcategoryId']) === null || _a === void 0 ? void 0 : _a.S,
                    postId: (_b = item.postId) === null || _b === void 0 ? void 0 : _b.S,
                    categoryId: (_c = item.categoryId) === null || _c === void 0 ? void 0 : _c.S,
                    subcategoryId: (_d = item.subcategoryId) === null || _d === void 0 ? void 0 : _d.S,
                    contentHTML: (_e = item.contentHTML) === null || _e === void 0 ? void 0 : _e.S,
                    postInfo: ((_f = item.postInfo) === null || _f === void 0 ? void 0 : _f.M) ? {
                        authorId: (_h = (_g = item.postInfo) === null || _g === void 0 ? void 0 : _g.M.authorId) === null || _h === void 0 ? void 0 : _h.S,
                        tags: (_k = (_j = item.postInfo) === null || _j === void 0 ? void 0 : _j.M.tags) === null || _k === void 0 ? void 0 : _k.SS,
                        excerpt: (_m = (_l = item.postInfo) === null || _l === void 0 ? void 0 : _l.M.excerpt) === null || _m === void 0 ? void 0 : _m.S,
                        featuredImageURL: (_p = (_o = item.postInfo) === null || _o === void 0 ? void 0 : _o.M.featuredImageURL) === null || _p === void 0 ? void 0 : _p.S,
                        modifiedDate: (_r = (_q = item.postInfo) === null || _q === void 0 ? void 0 : _q.M.modifiedDate) === null || _r === void 0 ? void 0 : _r.S,
                        publishDate: (_t = (_s = item.postInfo) === null || _s === void 0 ? void 0 : _s.M.publishDate) === null || _t === void 0 ? void 0 : _t.S,
                        readingTime: Number((_v = (_u = item.postInfo) === null || _u === void 0 ? void 0 : _u.M.readingTime) === null || _v === void 0 ? void 0 : _v.N),
                        slug: (_x = (_w = item.postInfo) === null || _w === void 0 ? void 0 : _w.M.slug) === null || _x === void 0 ? void 0 : _x.S,
                        status: (_z = (_y = item.postInfo) === null || _y === void 0 ? void 0 : _y.M.status) === null || _z === void 0 ? void 0 : _z.S,
                        title: (_1 = (_0 = item.postInfo) === null || _0 === void 0 ? void 0 : _0.M.title) === null || _1 === void 0 ? void 0 : _1.S,
                        views: Number((_3 = (_2 = item.postInfo) === null || _2 === void 0 ? void 0 : _2.M.views) === null || _3 === void 0 ? void 0 : _3.N),
                    } : undefined,
                    seo: ((_4 = item.seo) === null || _4 === void 0 ? void 0 : _4.M) ? {
                        canonical: (_6 = (_5 = item.seo) === null || _5 === void 0 ? void 0 : _5.M.canonical) === null || _6 === void 0 ? void 0 : _6.S,
                        description: (_8 = (_7 = item.seo) === null || _7 === void 0 ? void 0 : _7.M.description) === null || _8 === void 0 ? void 0 : _8.S,
                        keywords: (_10 = (_9 = item.seo) === null || _9 === void 0 ? void 0 : _9.M.keywords) === null || _10 === void 0 ? void 0 : _10.SS,
                    } : undefined,
                };
            });
        });
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PostsService);
