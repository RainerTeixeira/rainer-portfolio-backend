"use strict";
// src/app.module.ts
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const dynamoDb_service_1 = require("./services/dynamoDb.service"); // Importe o DynamoDbService
const blog_module_1 = require("./modules/blog/blog.module"); // Importe o BlogModule
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [blog_module_1.BlogModule], // Importe o BlogModule aqui
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService, dynamoDb_service_1.DynamoDbService], // Declare o DynamoDbService como provider global
    })
], AppModule);
