"use strict";
// src/modules/blog/authors/authors.module.ts
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorsModule = void 0;
const common_1 = require("@nestjs/common"); // Importa o decorator Module para definir o módulo.
const authors_controller_1 = require("./controllers/authors.controller"); // Importa AuthorsController usando @src.
const authors_service_1 = require("./services/authors.service"); // Importa AuthorsService usando @src.
let AuthorsModule = class AuthorsModule {
};
exports.AuthorsModule = AuthorsModule;
exports.AuthorsModule = AuthorsModule = __decorate([
    (0, common_1.Module)({
        controllers: [authors_controller_1.AuthorsController], // Declara os controllers deste módulo.
        providers: [authors_service_1.AuthorsService], // Declara os providers (services) deste módulo.
        exports: [authors_service_1.AuthorsService], // Exporta AuthorsService para outros módulos.
    })
], AuthorsModule);
