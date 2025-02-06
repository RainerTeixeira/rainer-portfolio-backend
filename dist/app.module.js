"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const blog_module_1 = require("./controller/blog.module"); // Importando o BlogModule com o alias configurado
const cognito_1 = require("./auth/cognito"); // Importando o AuthModule
const dynamoDb_1 = require("./services/dynamoDb"); // Importando o cliente DynamoDB
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            blog_module_1.BlogModule, // Inclui o BlogModule com todas as funcionalidades do blog (posts, autores, etc.)
            cognito_1.AuthModule, // Inclui o AuthModule para autenticação
        ],
        controllers: [], // Se houver controladores globais, adicione-os aqui
        providers: [
            { provide: 'DYNAMODB_CLIENT', useValue: dynamoDb_1.dynamoDBClient }, // Fornecendo o cliente DynamoDB globalmente.
        ],
    })
], AppModule);
