"use strict";
// src/modules/blog/category/services/categories.service.ts
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
exports.CategoryService = void 0;
const common_1 = require("@nestjs/common");
const dynamoDb_service_1 = require("../../../../services/dynamoDb.service"); // Importa DynamoDbService usando alias @src.
let CategoryService = class CategoryService {
    constructor(dynamoDbService) {
        this.dynamoDbService = dynamoDbService;
        this.tableName = 'Category'; // Nome da tabela DynamoDB para Category
    } // Injeta DynamoDbService
    create(createCategoryDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                TableName: this.tableName,
                Item: createCategoryDto,
            };
            yield this.dynamoDbService.putItem(params);
            return this.findOne(createCategoryDto.categoryId);
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.dynamoDbService.scan({ TableName: this.tableName });
            return (result.Items || []).map(item => this.mapCategoryFromDynamoDb(item)); // Use map e função de mapeamento
        });
    }
    findOne(categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                TableName: this.tableName,
                Key: { categoryId: { S: categoryId } },
            };
            const result = yield this.dynamoDbService.getItem(params);
            if (!result.Item) {
                throw new common_1.NotFoundException(`Category com ID '${categoryId}' não encontrada`);
            }
            return this.mapCategoryFromDynamoDb(result.Item); // Use função de mapeamento
        });
    }
    update(categoryId, updateCategoryDto) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            // Verifica se a categoria existe antes de atualizar
            yield this.findOne(categoryId);
            const params = {
                TableName: this.tableName,
                Key: { categoryId: { S: categoryId } },
                UpdateExpression: 'SET #name = :name, slug = :slug, seo = :seo', // Use 'SET' e placeholders para atualizar
                ExpressionAttributeNames: {
                    '#name': 'name', // '#name' será substituído por 'name' (evita palavras reservadas)
                },
                ExpressionAttributeValues: {
                    ':name': { S: updateCategoryDto.name }, // Formato correto do valor string para DynamoDB
                    ':slug': { S: updateCategoryDto.slug },
                    ':seo': {
                        M: {
                            canonical: { S: ((_a = updateCategoryDto.seo) === null || _a === void 0 ? void 0 : _a.canonical) || null }, // Se for opcional, use || null para evitar undefined
                            description: { S: ((_b = updateCategoryDto.seo) === null || _b === void 0 ? void 0 : _b.description) || null },
                            keywords: { L: ((_d = (_c = updateCategoryDto.seo) === null || _c === void 0 ? void 0 : _c.keywords) === null || _d === void 0 ? void 0 : _d.map(keyword => ({ S: keyword }))) || [] } // Se for array, mapeie para formato de lista do DynamoDB
                        }
                    },
                },
                ReturnValues: 'ALL_NEW', // Defina o tipo de retorno esperado
            };
            const result = yield this.dynamoDbService.updateItem(params);
            return this.mapCategoryFromDynamoDb(result.Attributes); // Mapeie o Attributes e faça type assertion para CategoryDto
        });
    }
    remove(categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Verifica se a categoria existe antes de deletar
            yield this.findOne(categoryId);
            const params = {
                TableName: this.tableName,
                Key: { categoryId: { S: categoryId } },
            };
            yield this.dynamoDbService.deleteItem(params);
        });
    }
    mapCategoryFromDynamoDb(item) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        return {
            categoryId: (_a = item.categoryId) === null || _a === void 0 ? void 0 : _a.S, // Acessa propriedades e extrai valor string (S) do DynamoDB
            name: (_b = item.name) === null || _b === void 0 ? void 0 : _b.S,
            slug: (_c = item.slug) === null || _c === void 0 ? void 0 : _c.S,
            seo: {
                canonical: (_f = (_e = (_d = item.seo) === null || _d === void 0 ? void 0 : _d.M) === null || _e === void 0 ? void 0 : _e.canonical) === null || _f === void 0 ? void 0 : _f.S,
                description: (_j = (_h = (_g = item.seo) === null || _g === void 0 ? void 0 : _g.M) === null || _h === void 0 ? void 0 : _h.description) === null || _j === void 0 ? void 0 : _j.S,
                keywords: (_o = (_m = (_l = (_k = item.seo) === null || _k === void 0 ? void 0 : _k.M) === null || _l === void 0 ? void 0 : _l.keywords) === null || _m === void 0 ? void 0 : _m.L) === null || _o === void 0 ? void 0 : _o.map((keywordItem) => keywordItem.S) // Mapeia lista de strings
            },
        }; // 'as CategoryDto' agora é mais seguro, pois você mapeou as propriedades
    }
};
exports.CategoryService = CategoryService;
exports.CategoryService = CategoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dynamoDb_service_1.DynamoDbService])
], CategoryService);
