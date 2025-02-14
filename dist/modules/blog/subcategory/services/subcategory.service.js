"use strict";
// src/modules/blog/Subcategory/services/subcaSubcategorytegoria.service.ts
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
exports.SubcategoryService = void 0;
const common_1 = require("@nestjs/common");
const dynamoDb_service_1 = require("../../../../services/dynamoDb.service"); // Importa DynamoDbService com 'Db' correto
let SubcategoryService = class SubcategoryService {
    constructor(dynamoDbService) {
        this.dynamoDbService = dynamoDbService;
        this.tableName = 'Subcategory'; // Nome da tabela no DynamoDB
    }
    createSubcategory(categoryIdSubcategoryId, createSubcategoryDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const compositeKey = `${createSubcategoryDto.categoryId}#${createSubcategoryDto.subcategoryId}`; // Cria chave composta (categoryId#subcategoryId)
            const params = {
                TableName: this.tableName,
                Item: Object.assign(Object.assign({}, createSubcategoryDto), { 'categoryId#subcategoryId': compositeKey, subcategoryId: createSubcategoryDto.subcategoryId }),
            };
            yield this.dynamoDbService.putItem(params); // Salva o novo item no DynamoDB
            return this.getSubcategoryById(categoryIdSubcategoryId, createSubcategoryDto.subcategoryId); // Retorna a subcategoria recém-criada buscando-a pelo ID
        });
    }
    getAllSubcategories(categoryIdSubcategoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                TableName: this.tableName,
                FilterExpression: 'begins_with(#pk, :pk_prefix)', // FilterExpression para buscar por prefixo da chave de partição (PK)
                ExpressionAttributeNames: {
                    '#pk': 'categoryId#subcategoryId', // Placeholder para o nome do atributo da chave de partição
                },
                ExpressionAttributeValues: {
                    ':pk_prefix': categoryIdSubcategoryId, // Placeholder para o valor do prefixo da chave de partição
                },
            };
            const result = yield this.dynamoDbService.scan(params); // Escaneia a tabela (busca eficiente para este caso)
            if (!result.Items) {
                return []; // Retorna array vazio se não encontrar itens
            }
            return result.Items.map((item) => {
                var _a, _b, _c;
                return ({
                    categoryIdSubcategoryId: categoryIdSubcategoryId, // **Correção Crucial: Nome da propriedade corrigido para categoryIdSubcategoryId**
                    subcategoryId: (_a = item.subcategoryId) === null || _a === void 0 ? void 0 : _a.S,
                    name: (_b = item.name) === null || _b === void 0 ? void 0 : _b.S,
                    slug: (_c = item.slug) === null || _c === void 0 ? void 0 : _c.S,
                });
            }) || []; // Converte o objeto literal para SubcategoryDto
        });
    }
    getSubcategoryById(categoryIdSubcategoryId, subcategoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const params = {
                TableName: this.tableName,
                Key: {
                    'categoryId#subcategoryId': categoryIdSubcategoryId, // Chave primária de partição (PK)
                    subcategoryId: subcategoryId, // Chave primária de ordenação (SK)
                },
            };
            const result = yield this.dynamoDbService.getItem(params); // Busca o item no DynamoDB usando a chave
            if (!result.Item) {
                throw new common_1.NotFoundException(`Subcategoria com ID '${subcategoryId}' na categoria '${categoryIdSubcategoryId}' não encontrada`); // Lança exceção se não encontrar
            }
            return {
                categoryIdSubcategoryId: categoryIdSubcategoryId, // **Correção Crucial: Nome da propriedade corrigido para categoryIdSubcategoryId**
                subcategoryId: (_a = result.Item.subcategoryId) === null || _a === void 0 ? void 0 : _a.S,
                name: (_b = result.Item.name) === null || _b === void 0 ? void 0 : _b.S,
                slug: (_c = result.Item.slug) === null || _c === void 0 ? void 0 : _c.S,
            }; // Converte o objeto literal para SubcategoryDto
        });
    }
    updateSubcategory(categoryIdSubcategoryId, subcategoryId, updateSubcategoryDto) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            yield this.getSubcategoryById(categoryIdSubcategoryId, subcategoryId); // Garante que a subcategoria existe antes de tentar atualizar
            const updateExpression = this.dynamoDbService.buildUpdateExpression(updateSubcategoryDto); // Constrói a expressão de atualização dinamicamente
            if (!updateExpression) {
                return this.getSubcategoryById(categoryIdSubcategoryId, subcategoryId); // Se não houver campos para atualizar, retorna a subcategoria existente
            }
            const params = Object.assign(Object.assign({ TableName: this.tableName, Key: {
                    'categoryId#subcategoryId': categoryIdSubcategoryId, // Chave primária de partição (PK)
                    subcategoryId: subcategoryId, // Chave primária de ordenação (SK)
                } }, updateExpression), { ReturnValues: 'ALL_NEW' });
            const result = yield this.dynamoDbService.updateItem(params); // Atualiza o item no DynamoDB
            if (!result.Attributes) {
                throw new common_1.NotFoundException(`Subcategoria com ID '${subcategoryId}' na categoria '${categoryIdSubcategoryId}' não encontrada após atualização.`); // Lança exceção se não encontrar atributos após atualização
            }
            return {
                categoryIdSubcategoryId: categoryIdSubcategoryId, // **Correção Crucial: Nome da propriedade corrigido para categoryIdSubcategoryId**
                subcategoryId: (_a = result.Attributes.subcategoryId) === null || _a === void 0 ? void 0 : _a.S,
                name: (_b = result.Attributes.name) === null || _b === void 0 ? void 0 : _b.S,
                slug: (_c = result.Attributes.slug) === null || _c === void 0 ? void 0 : _c.S,
            }; // Converte o objeto literal para SubcategoryDto
        });
    }
    deleteSubcategory(categoryIdSubcategoryId, subcategoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getSubcategoryById(categoryIdSubcategoryId, subcategoryId); // Garante que a subcategoria existe antes de deletar
            const params = {
                TableName: this.tableName,
                Key: {
                    'categoryId#subcategoryId': categoryIdSubcategoryId, // Chave primária de partição (PK)
                    subcategoryId: subcategoryId, // Chave primária de ordenação (SK)
                },
            };
            yield this.dynamoDbService.deleteItem(params); // Deleta o item do DynamoDB
        });
    }
};
exports.SubcategoryService = SubcategoryService;
exports.SubcategoryService = SubcategoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dynamoDb_service_1.DynamoDbService])
], SubcategoryService);
