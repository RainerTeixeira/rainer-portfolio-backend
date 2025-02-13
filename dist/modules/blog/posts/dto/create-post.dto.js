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
exports.CreatePostDto = exports.CreateCategoryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const reference_dto_1 = require("./reference.dto");
class CreateCategoryDto {
}
exports.CreateCategoryDto = CreateCategoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'ID da categoria principal' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateCategoryDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5, description: 'ID da subcategoria' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateCategoryDto.prototype, "subCategoryId", void 0);
class CreatePostDto {
}
exports.CreatePostDto = CreatePostDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Título Impactante', description: 'Título principal do post' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePostDto.prototype, "postTitle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Resumo do post...', description: 'Resumo para preview' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePostDto.prototype, "postSummary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Conteúdo completo do post...', description: 'Corpo do post' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePostDto.prototype, "postContent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [1, 2], description: 'IDs dos autores', type: [Number] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsInt)({ each: true }),
    (0, class_validator_1.IsPositive)({ each: true }),
    __metadata("design:type", Array)
], CreatePostDto.prototype, "authorIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: CreateCategoryDto }),
    (0, class_validator_1.IsDefined)(),
    (0, class_validator_1.IsNotEmptyObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CreateCategoryDto),
    __metadata("design:type", CreateCategoryDto)
], CreatePostDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['tag1', 'tag2'], description: 'Tags relacionadas', type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreatePostDto.prototype, "postTags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5, description: 'Tempo de leitura em minutos' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreatePostDto.prototype, "postReadingTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-01T00:00:00.000Z', description: 'Data de publicação do post' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], CreatePostDto.prototype, "postDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['imagem1.jpg'], description: 'URLs das imagens', type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreatePostDto.prototype, "postImages", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: [3], description: 'IDs de posts relacionados', type: [Number] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsInt)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreatePostDto.prototype, "relatedPosts", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [reference_dto_1.ReferenceDto], description: 'Referências bibliográficas' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => reference_dto_1.ReferenceDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreatePostDto.prototype, "references", void 0);
