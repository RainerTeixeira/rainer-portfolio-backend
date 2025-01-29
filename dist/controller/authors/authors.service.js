"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorsService = void 0;
const common_1 = require("@nestjs/common");
const aws_sdk_1 = require("aws-sdk");
let AuthorsService = class AuthorsService {
    constructor() {
        this.dynamoDb = new aws_sdk_1.DynamoDB.DocumentClient();
        this.tableName = process.env.DYNAMODB_TABLE_AUTHORS || 'default-table-name';
    }
    async create(createAuthorDto) {
        const params = {
            TableName: this.tableName,
            Item: {
                id: new Date().getTime().toString(),
                ...createAuthorDto,
            },
        };
        await this.dynamoDb.put(params).promise();
        return params.Item;
    }
    async findAll() {
        const params = {
            TableName: this.tableName,
        };
        const result = await this.dynamoDb.scan(params).promise();
        return result.Items;
    }
    async findOne(id) {
        const params = {
            TableName: this.tableName,
            Key: { id },
        };
        const result = await this.dynamoDb.get(params).promise();
        return result.Item;
    }
    async update(id, updateAuthorDto) {
        const params = {
            TableName: this.tableName,
            Key: { id },
            UpdateExpression: 'set #name = :name, #bio = :bio, #website = :website',
            ExpressionAttributeNames: {
                '#name': 'name',
                '#bio': 'bio',
                '#website': 'website',
            },
            ExpressionAttributeValues: {
                ':name': updateAuthorDto.name,
                ':bio': updateAuthorDto.bio,
                ':website': updateAuthorDto.website,
            },
            ReturnValues: 'ALL_NEW',
        };
        const result = await this.dynamoDb.update(params).promise();
        return result.Attributes;
    }
    async delete(id) {
        const params = {
            TableName: this.tableName,
            Key: { id },
        };
        await this.dynamoDb.delete(params).promise();
        return { message: `Author with id ${id} deleted successfully` };
    }
};
exports.AuthorsService = AuthorsService;
exports.AuthorsService = AuthorsService = __decorate([
    (0, common_1.Injectable)()
], AuthorsService);
//# sourceMappingURL=authors.service.js.map