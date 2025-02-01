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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsController = void 0;
const common_1 = require("@nestjs/common");
const dynamoDb_1 = require("../../services/dynamoDb");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
const dto_1 = require("./dto");
let PostsController = class PostsController {
    async create(createPostDto) {
        const item = {
            postId: { N: Date.now().toString() },
            ...(0, util_dynamodb_1.marshall)(createPostDto)
        };
        await dynamoDb_1.dynamoDBClient.send(new client_dynamodb_1.PutItemCommand({
            TableName: process.env.DYNAMODB_TABLE,
            Item: item
        }));
        return (0, util_dynamodb_1.unmarshall)(item);
    }
    async findOne(id) {
        const { Item } = await dynamoDb_1.dynamoDBClient.send(new client_dynamodb_1.GetItemCommand({
            TableName: process.env.DYNAMODB_TABLE,
            Key: { postId: { N: id } }
        }));
        return Item ? (0, util_dynamodb_1.unmarshall)(Item) : {};
    }
    async update(id, updatePostDto) {
        const expression = Object.keys(updatePostDto)
            .map((key, index) => `${key} = :val${index}`)
            .join(', ');
        const values = Object.entries(updatePostDto).reduce((acc, [key, val], index) => ({ ...acc, [`:val${index}`]: val }), {});
        const { Attributes } = await dynamoDb_1.dynamoDBClient.send(new client_dynamodb_1.UpdateItemCommand({
            TableName: process.env.DYNAMODB_TABLE,
            Key: { postId: { N: id } },
            UpdateExpression: `SET ${expression}`,
            ExpressionAttributeValues: (0, util_dynamodb_1.marshall)(values),
            ReturnValues: 'ALL_NEW'
        }));
        return Attributes ? (0, util_dynamodb_1.unmarshall)(Attributes) : {};
    }
    async remove(id) {
        await dynamoDb_1.dynamoDBClient.send(new client_dynamodb_1.DeleteItemCommand({
            TableName: process.env.DYNAMODB_TABLE,
            Key: { postId: { N: id } }
        }));
        return { deleted: true };
    }
};
exports.PostsController = PostsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreatePostDto]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdatePostDto]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "remove", null);
exports.PostsController = PostsController = __decorate([
    (0, common_1.Controller)('posts')
], PostsController);
//# sourceMappingURL=posts.controller.js.map