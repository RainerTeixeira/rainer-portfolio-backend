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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePostDto = void 0;
// src/modules/blog/posts/dto/create-post.dto.ts
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const post_info_dto_1 = require("./post-info.dto");
const post_seo_dto_1 = require("./post-seo.dto");
/**
 * DTO (Data Transfer Object) para criar um novo Post.
 * Define a estrutura dos dados necessários para criar um post,
 * incluindo validações para garantir a integridade dos dados.
 */
class CreatePostDto {
    /**
     * Construtor para CreatePostDto.
     * Inicializa as propriedades do DTO.
     */
    constructor(categoryId, subcategoryId, contentHTML, postInfo, seo) {
        this.categoryId = categoryId;
        this.subcategoryId = subcategoryId;
        this.contentHTML = contentHTML;
        this.postInfo = postInfo;
        this.seo = seo;
    }
}
exports.CreatePostDto = CreatePostDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePostDto.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePostDto.prototype, "subcategoryId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePostDto.prototype, "contentHTML", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => post_info_dto_1.PostInfoDto),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", post_info_dto_1.PostInfoDto)
], CreatePostDto.prototype, "postInfo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => post_seo_dto_1.PostSeoDto),
    __metadata("design:type", post_seo_dto_1.PostSeoDto)
], CreatePostDto.prototype, "seo", void 0);
