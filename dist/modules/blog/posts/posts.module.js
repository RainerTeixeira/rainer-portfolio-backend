"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsModule = void 0;
const common_1 = require("@nestjs/common");
const posts_controller_1 = require("./posts.controller"); // Caminho relativo
const posts_service_1 = require("./posts.service"); // Caminho relativo
const dynamoDb_service_1 = require("../../../services/dynamoDb.service");
/**
 * Módulo responsável pela gestão de posts do blog, incluindo operações CRUD.
 */
let PostsModule = class PostsModule {
};
exports.PostsModule = PostsModule;
exports.PostsModule = PostsModule = __decorate([
    (0, common_1.Module)({
        imports: [dynamoDb_service_1.DynamoDbModule], // Fornece acesso ao DynamoDB
        controllers: [posts_controller_1.PostsController], // Controladores das rotas
        providers: [posts_service_1.PostsService], // Serviço com lógica de negócio
    })
], PostsModule);
