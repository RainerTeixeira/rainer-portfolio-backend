"use strict";
// src/modules/blog/comments/controllers/comments.controller.ts
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
exports.CommentsController = void 0;
const common_1 = require("@nestjs/common"); // Importa decorators do NestJS para controllers.
const comments_service_1 = require("../services/comments.service"); // Importa CommentsService usando alias @src.
const create_comment_dto_1 = require("../dto/create-comment.dto"); // Importa CreateCommentDto usando alias @src.
const update_comment_dto_1 = require("../dto/update-comment.dto"); // Importa UpdateCommentDto usando alias @src.
let CommentsController = class CommentsController {
    constructor(commentsService) {
        this.commentsService = commentsService;
    }
    create(createCommentDto) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.commentsService.create(createCommentDto);
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.commentsService.findAll();
        });
    }
    findOne(postId, authorId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.commentsService.findOne(postId, authorId);
        });
    }
    update(postId, authorId, updateCommentDto) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.commentsService.update(postId, authorId, updateCommentDto);
        });
    }
    remove(postId, authorId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.commentsService.remove(postId, authorId);
        });
    }
};
exports.CommentsController = CommentsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_comment_dto_1.CreateCommentDto]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':postId/:authorId'),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, common_1.Param)('authorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':postId/:authorId'),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, common_1.Param)('authorId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_comment_dto_1.UpdateCommentDto]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':postId/:authorId'),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, common_1.Param)('authorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "remove", null);
exports.CommentsController = CommentsController = __decorate([
    (0, common_1.Controller)('blog/comments'),
    __metadata("design:paramtypes", [comments_service_1.CommentsService])
], CommentsController);
