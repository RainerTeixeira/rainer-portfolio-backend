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
exports.AuthorsService = void 0;
const common_1 = require("@nestjs/common");
const dynamoDb_service_1 = require("../../../../services/dynamoDb.service"); // Importe DynamoDbService
let AuthorsService = class AuthorsService {
    constructor(dynamoDbService) {
        this.dynamoDbService = dynamoDbService;
        this.tableName = 'Authors'; // Nome da tabela DynamoDB para Authors
    } // Injeta DynamoDbService
    create(createAuthorDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                TableName: this.tableName,
                Item: createAuthorDto,
            };
            yield this.dynamoDbService.putItem(params);
            return this.findOne(createAuthorDto.postId, createAuthorDto.authorId); // Retorna o autor criado
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                TableName: this.tableName,
                //  IndexName: 'your-index-name', // Se precisar usar um GSI
            };
            const result = yield this.dynamoDbService.scan(params); // Use scan instead of scanItems
            return (result.Items || []).map(item => this.mapAuthorFromDynamoDb(item));
        });
    }
    findOne(postId, authorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                TableName: this.tableName,
                Key: {
                    postId: { S: postId }, // postId como String
                    authorId: { S: authorId }, // authorId como String
                },
            };
            const result = yield this.dynamoDbService.getItem(params);
            if (!result.Item) {
                throw new common_1.NotFoundException(`Author com postId '${postId}' e authorId '${authorId}' não encontrado`);
            }
            return this.mapAuthorFromDynamoDb(result.Item);
        });
    }
    update(postId, authorId, updateAuthorDto) {
        return __awaiter(this, void 0, void 0, function* () {
            // Verifica se o autor existe antes de atualizar
            yield this.findOne(postId, authorId);
            const updateExpression = this.dynamoDbService.buildUpdateExpression(updateAuthorDto);
            if (!updateExpression) {
                return this.findOne(postId, authorId); // Se não houver campos para atualizar, retorna o autor existente
            }
            const params = Object.assign(Object.assign({ TableName: this.tableName, Key: {
                    postId: { S: postId },
                    authorId: { S: authorId },
                } }, updateExpression), { ReturnValues: 'ALL_NEW' });
            const result = yield this.dynamoDbService.updateItem(params);
            return this.mapAuthorFromDynamoDb(result.Attributes); // Retorna o autor atualizado
        });
    }
    remove(postId, authorId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Verifica se o autor existe antes de deletar
            yield this.findOne(postId, authorId);
            const params = {
                TableName: this.tableName,
                Key: {
                    postId: { S: postId },
                    authorId: { S: authorId },
                },
            };
            yield this.dynamoDbService.deleteItem(params);
        });
    }
    mapAuthorFromDynamoDb(item) {
        var _a, _b, _c, _d, _e, _f, _g;
        return {
            postId: (_a = item.postId) === null || _a === void 0 ? void 0 : _a.S,
            authorId: (_b = item.authorId) === null || _b === void 0 ? void 0 : _b.S,
            name: (_c = item.name) === null || _c === void 0 ? void 0 : _c.S,
            slug: (_d = item.slug) === null || _d === void 0 ? void 0 : _d.S,
            expertise: ((_f = (_e = item.expertise) === null || _e === void 0 ? void 0 : _e.L) === null || _f === void 0 ? void 0 : _f.map((expertiseItem) => expertiseItem.S)) || [],
            socialProof: Object.entries(((_g = item.socialProof) === null || _g === void 0 ? void 0 : _g.M) || {}).reduce((obj, [key, value]) => {
                obj[key] = value.S;
                return obj;
            }, {}) || {},
        };
    }
};
exports.AuthorsService = AuthorsService;
exports.AuthorsService = AuthorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dynamoDb_service_1.DynamoDbService])
], AuthorsService);
