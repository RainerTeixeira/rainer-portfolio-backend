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
exports.PostBaseDto = exports.SeoDto = exports.SectionDto = exports.CategoryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const reference_dto_1 = require("./reference.dto");
class CategoryDto {
}
exports.CategoryDto = CategoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], CategoryDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5 }),
    __metadata("design:type", Number)
], CategoryDto.prototype, "subCategoryId", void 0);
class SectionDto {
}
exports.SectionDto = SectionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], SectionDto.prototype, "sectionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Introdução' }),
    __metadata("design:type", String)
], SectionDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Conteúdo...' }),
    __metadata("design:type", String)
], SectionDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['text', 'code', 'quote'] }),
    __metadata("design:type", String)
], SectionDto.prototype, "type", void 0);
class SeoDto {
}
exports.SeoDto = SeoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://site.com/post' }),
    __metadata("design:type", String)
], SeoDto.prototype, "canonicalUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Descrição SEO' }),
    __metadata("design:type", String)
], SeoDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['keyword'] }),
    __metadata("design:type", Array)
], SeoDto.prototype, "keywords", void 0);
class PostBaseDto {
}
exports.PostBaseDto = PostBaseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], PostBaseDto.prototype, "postId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-01T00:00:00.000Z' }),
    __metadata("design:type", Date)
], PostBaseDto.prototype, "postDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [1, 2] }),
    __metadata("design:type", Array)
], PostBaseDto.prototype, "authorIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: CategoryDto }),
    __metadata("design:type", CategoryDto)
], PostBaseDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: [3] }),
    __metadata("design:type", Array)
], PostBaseDto.prototype, "comments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: [5] }),
    __metadata("design:type", Array)
], PostBaseDto.prototype, "externalIntegrations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Conteúdo...' }),
    __metadata("design:type", String)
], PostBaseDto.prototype, "postContent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['imagem.jpg'] }),
    __metadata("design:type", Array)
], PostBaseDto.prototype, "postImages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-02T00:00:00.000Z' }),
    __metadata("design:type", Date)
], PostBaseDto.prototype, "postLastUpdated", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5 }),
    __metadata("design:type", Number)
], PostBaseDto.prototype, "postReadingTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: [1, 2] }),
    __metadata("design:type", Number)
], PostBaseDto.prototype, "postStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Resumo...' }),
    __metadata("design:type", String)
], PostBaseDto.prototype, "postSummary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['tag'] }),
    __metadata("design:type", Array)
], PostBaseDto.prototype, "postTags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Título' }),
    __metadata("design:type", String)
], PostBaseDto.prototype, "postTitle", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['https://youtube.com'] }),
    __metadata("design:type", Array)
], PostBaseDto.prototype, "postVideoEmbedUrls", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [reference_dto_1.ReferenceDto] }),
    __metadata("design:type", Array)
], PostBaseDto.prototype, "references", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: [2] }),
    __metadata("design:type", Array)
], PostBaseDto.prototype, "relatedPosts", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [SectionDto] }),
    __metadata("design:type", Array)
], PostBaseDto.prototype, "sections", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: SeoDto }),
    __metadata("design:type", SeoDto)
], PostBaseDto.prototype, "seo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 150 }),
    __metadata("design:type", Number)
], PostBaseDto.prototype, "viewsCount", void 0);
