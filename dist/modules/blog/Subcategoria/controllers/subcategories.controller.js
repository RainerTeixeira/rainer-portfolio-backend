"use strict";
// src/modules/blog/subcategoria/controllers/subcategoria.controller.ts
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubcategoriaController = void 0;
const common_1 = require("@nestjs/common");
const subcategoria_service_1 = require("../services/subcategoria.service");
const create_subcategoria_dto_1 = require("../dto/create-subcategoria.dto");
const update_subcategoria_dto_1 = require("../dto/update-subcategoria.dto");
let SubcategoriaController = class SubcategoriaController {
    constructor(subcategoriaService) {
        this.subcategoriaService = subcategoriaService;
    }
    create(createSubcategoriaDto) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.subcategoriaService.create(createSubcategoriaDto);
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.subcategoriaService.findAll();
        });
    }
    findOne(categoryIdSubcategoryId, subcategoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.subcategoriaService.findOne(categoryIdSubcategoryId, subcategoryId);
        });
    }
    update(categoryIdSubcategoryId, subcategoryId, updateSubcategoriaDto) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.subcategoriaService.update(categoryIdSubcategoryId, subcategoryId, updateSubcategoriaDto);
        });
    }
    remove(categoryIdSubcategoryId, subcategoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.subcategoriaService.remove(categoryIdSubcategoryId, subcategoryId);
        });
    }
};
exports.SubcategoriaController = SubcategoriaController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_subcategoria_dto_1.CreateSubcategoriaDto !== "undefined" && create_subcategoria_dto_1.CreateSubcategoriaDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], SubcategoriaController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubcategoriaController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':categoryIdSubcategoryId/:subcategoryId'),
    __param(0, (0, common_1.Param)('categoryIdSubcategoryId')),
    __param(1, (0, common_1.Param)('subcategoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SubcategoriaController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':categoryIdSubcategoryId/:subcategoryId'),
    __param(0, (0, common_1.Param)('categoryIdSubcategoryId')),
    __param(1, (0, common_1.Param)('subcategoryId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, typeof (_c = typeof update_subcategoria_dto_1.UpdateSubcategoriaDto !== "undefined" && update_subcategoria_dto_1.UpdateSubcategoriaDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], SubcategoriaController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':categoryIdSubcategoryId/:subcategoryId'),
    __param(0, (0, common_1.Param)('categoryIdSubcategoryId')),
    __param(1, (0, common_1.Param)('subcategoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SubcategoriaController.prototype, "remove", null);
exports.SubcategoriaController = SubcategoriaController = __decorate([
    (0, common_1.Controller)('blog/subcategorias'),
    __metadata("design:paramtypes", [typeof (_a = typeof subcategoria_service_1.SubcategoriaService !== "undefined" && subcategoria_service_1.SubcategoriaService) === "function" ? _a : Object])
], SubcategoriaController);
