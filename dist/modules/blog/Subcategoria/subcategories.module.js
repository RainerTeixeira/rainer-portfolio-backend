"use strict";
// src/modules/blog/subcategoria/subcategoria.module.ts
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubcategoriaModule = void 0;
const common_1 = require("@nestjs/common");
const subcategoria_controller_1 = require("./controllers/subcategoria.controller");
const subcategoria_service_1 = require("./services/subcategoria.service");
let SubcategoriaModule = class SubcategoriaModule {
};
exports.SubcategoriaModule = SubcategoriaModule;
exports.SubcategoriaModule = SubcategoriaModule = __decorate([
    (0, common_1.Module)({
        controllers: [subcategoria_controller_1.SubcategoriaController],
        providers: [subcategoria_service_1.SubcategoriaService],
        exports: [subcategoria_service_1.SubcategoriaService],
    })
], SubcategoriaModule);
