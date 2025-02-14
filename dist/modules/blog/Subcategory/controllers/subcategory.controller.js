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
exports.SubcategoryController = void 0;
const common_1 = require("@nestjs/common"); // Importa decorators do NestJS para controllers.
let SubcategoryController = class SubcategoryController {
    constructor(subcategoryService) {
        this.subcategoryService = subcategoryService;
    }
    create(createSubcategoryDto) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.subcategoryService.create(createSubcategoriaDto);
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.subcategoryService.findAll();
        });
    }
    findOne(categoryIdSubcategoryId, subcategoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.subcategoryService.findOne(categoryIdSubcategoryId, subcategoryId);
        });
    }
    update(categoryIdSubcategoryId, subcategoryId, updateSubcategoriaDto) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.subcategoryService.update(categoryIdSubcategoryId, subcategoryId, updateSubcategoriaDto);
        });
    }
    remove(categoryIdSubcategoryId, subcategoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.subcategoryService.remove(categoryIdSubcategoryId, subcategoryId);
        });
    }
};
exports.SubcategoryController = SubcategoryController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof CreateSubcategyDto !== "undefined" && CreateSubcategyDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], SubcategoryController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubcategoryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':categoryIdSubcategoryId/:subcategoryId'),
    __param(0, (0, common_1.Param)('categoryIdSubcategoryId')),
    __param(1, (0, common_1.Param)('subcategoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SubcategoryController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':categoryIdSubcategoryId/:subcategoryId'),
    __param(0, (0, common_1.Param)('categoryIdSubcategoryId')),
    __param(1, (0, common_1.Param)('subcategoryId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, typeof (_c = typeof UpdateSubcategoriaDto !== "undefined" && UpdateSubcategoriaDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], SubcategoryController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':categoryIdSubcategoryId/:subcategoryId'),
    __param(0, (0, common_1.Param)('categoryIdSubcategoryId')),
    __param(1, (0, common_1.Param)('subcategoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SubcategoryController.prototype, "remove", null);
exports.SubcategoryController = SubcategoryController = __decorate([
    (0, common_1.Controller)('blog/subcategorias'),
    __metadata("design:paramtypes", [typeof (_a = typeof SubcategoriaService !== "undefined" && SubcategoriaService) === "function" ? _a : Object])
], SubcategoryController);
