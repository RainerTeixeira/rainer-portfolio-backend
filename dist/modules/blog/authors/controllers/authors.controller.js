"use strict";
// src/modules/blog/authors/controllers/authors.controller.ts
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorsController = void 0;
const common_1 = require("@nestjs/common"); // Importa decorators do NestJS para controllers.
const authors_service_1 = require("../services/authors.service"); // Importa AuthorsService usando alias @src.
const create_author_dto_1 = require("../dto/create-author.dto"); // Importa CreateAuthorDto usando alias @src.
const update_author_dto_1 = require("../dto/update-author.dto"); // Importa UpdateAuthorDto usando alias @src.
let AuthorsController = class AuthorsController {
    constructor(authorsService) {
        this.authorsService = authorsService;
    } // Injeta AuthorsService
    create(createAuthorDto) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.authorsService.create(createAuthorDto);
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.authorsService.findAll();
        });
    }
    findOne(postId, authorId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.authorsService.findOne(postId, authorId);
        });
    }
    update(postId, authorId, updateAuthorDto) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.authorsService.update(postId, authorId, updateAuthorDto);
        });
    }
    remove(postId, authorId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.authorsService.remove(postId, authorId);
        });
    }
};
exports.AuthorsController = AuthorsController;
__decorate([
    (0, common_1.Post)() // POST /blog/authors
    ,
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_author_dto_1.CreateAuthorDto]),
    __metadata("design:returntype", Promise)
], AuthorsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)() // GET /blog/authors
    ,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthorsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':postId/:authorId') // GET /blog/authors/:postId/:authorId
    ,
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, common_1.Param)('authorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuthorsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':postId/:authorId') // PUT /blog/authors/:postId/:authorId
    ,
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, common_1.Param)('authorId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_author_dto_1.UpdateAuthorDto]),
    __metadata("design:returntype", Promise)
], AuthorsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':postId/:authorId') // DELETE /blog/authors/:postId/:authorId
    ,
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, common_1.Param)('authorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuthorsController.prototype, "remove", null);
exports.AuthorsController = AuthorsController = __decorate([
    (0, common_1.Controller)('blog/authors') // Define o endpoint base para este controller
    ,
    __metadata("design:paramtypes", [authors_service_1.AuthorsService])
], AuthorsController);
