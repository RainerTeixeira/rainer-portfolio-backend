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
exports.SubcategoriaService = void 0;
const common_1 = require("@nestjs/common");
const dynamodb_service_1 = require("../../../../services/dynamodb.service"); // Importa DynamoDbService usando alias @src.
let SubcategoriaService = class SubcategoriaService {
    constructor(dynamoDbService) {
        this.dynamoDbService = dynamoDbService;
        this.tableName = 'Subcategory';
    }
    create(createSubcategoriaDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const categorySubcategoryId = `${createSubcategoriaDto.categoryId}#${createSubcategoriaDto.subcategoryId}`;
            const params = {
                TableName: this.tableName,
                Item: Object.assign(Object.assign({}, createSubcategoriaDto), { 'categoryId#subcategoryId': categorySubcategoryId }),
            };
            yield this.dynamoDbService.putItem(params);
            return this.findOne(categorySubcategoryId, createSubcategoriaDto.subcategoryId);
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
    findOne(categoryIdSubcategoryId, subcategoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                TableName: this.tableName,
                Key: {
                    'categoryId#subcategoryId': { S: categoryIdSubcategoryId },
                    subcategoryId: { S: subcategoryId },
                },
            };
            const result = yield this.dynamoDbService.getItem(params);
            if (!result.Item) {
                throw new common_1.NotFoundException(`Subcategoria com categoryId#subcategoryId '${categoryIdSubcategoryId}' e subcategoryId '${subcategoryId}' não encontrada`);
            }
            return result.Item;
        });
    }
    update(categoryIdSubcategoryId, subcategoryId, updateSubcategoriaDto) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.findOne(categoryIdSubcategoryId, subcategoryId);
            const updateExpression = this.dynamoDbService.buildUpdateExpression(updateSubcategoriaDto);
            if (!updateExpression) {
                return this.findOne(categoryIdSubcategoryId, subcategoryId);
            }
            const params = Object.assign(Object.assign({ TableName: this.tableName, Key: {
                    'categoryId#subcategoryId': { S: categoryIdSubcategoryId },
                    subcategoryId: { S: subcategoryId },
                } }, updateExpression), { ReturnValues: 'ALL_NEW' });
            const result = yield this.dynamoDbService.updateItem(params);
            return result.Attributes;
        });
    }
    remove(categoryIdSubcategoryId, subcategoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.findOne(categoryIdSubcategoryId, subcategoryId);
            const params = {
                TableName: this.tableName,
                Key: {
                    'categoryId#subcategoryId': { S: categoryIdSubcategoryId },
                    subcategoryId: { S: subcategoryId },
                },
            };
            yield this.dynamoDbService.deleteItem(params);
        });
    }
};
exports.SubcategoriaService = SubcategoriaService;
exports.SubcategoriaService = SubcategoriaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dynamodb_service_1.DynamoDbService])
], SubcategoriaService);
