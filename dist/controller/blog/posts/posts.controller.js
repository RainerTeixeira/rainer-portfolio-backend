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
exports.PostsController = void 0;
const common_1 = require("@nestjs/common");
const posts_service_1 = require("./posts.service");
const dto_1 = require("./dto"); // Certifique-se de importar corretamente os DTOs
let PostsController = class PostsController {
    constructor(postsService) {
        this.postsService = postsService;
    }
    create(createPostDto) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.postsService.create(createPostDto);
            }
            catch (error) {
                throw new common_1.HttpException(error instanceof Error ? error.message : 'Erro desconhecido', common_1.HttpStatus.BAD_REQUEST);
            }
        });
    }
    findAll(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.postsService.findAll(query);
            }
            catch (error) {
                throw new common_1.HttpException(error instanceof Error ? error.message : 'Erro desconhecido', common_1.HttpStatus.BAD_REQUEST);
            }
        });
    }
    findOne(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.postsService.findOne(id);
            }
            catch (error) {
                throw new common_1.HttpException(error instanceof Error ? error.message : 'Erro desconhecido', common_1.HttpStatus.NOT_FOUND);
            }
        });
    }
    update(id, updatePostDto) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.postsService.update(id, updatePostDto);
            }
            catch (error) {
                throw new common_1.HttpException(error instanceof Error ? error.message : 'Erro desconhecido', common_1.HttpStatus.BAD_REQUEST);
            }
        });
    }
    remove(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.postsService.remove(id);
            }
            catch (error) {
                throw new common_1.HttpException(error instanceof Error ? error.message : 'Erro desconhecido', common_1.HttpStatus.BAD_REQUEST);
            }
        });
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
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "findAll", null);
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
    (0, common_1.Controller)('posts'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })) // Transforma os dados de entrada para os tipos dos DTOs
    ,
    __metadata("design:paramtypes", [posts_service_1.PostsService])
], PostsController);
