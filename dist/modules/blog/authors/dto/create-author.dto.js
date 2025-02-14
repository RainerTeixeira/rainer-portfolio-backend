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
exports.CreateAuthorDto = void 0;
// src/modules/blog/authors/dto/create-author.dto.ts
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const author_social_proof_dto_1 = require("./author-social-proof.dto");
class CreateAuthorDto {
    constructor(postId, authorId, expertise, name, slug, socialProof) {
        this.postId = postId;
        this.authorId = authorId;
        this.expertise = expertise;
        this.name = name;
        this.slug = slug;
        this.socialProof = socialProof;
    }
}
exports.CreateAuthorDto = CreateAuthorDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAuthorDto.prototype, "postId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAuthorDto.prototype, "authorId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateAuthorDto.prototype, "expertise", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAuthorDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAuthorDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => author_social_proof_dto_1.AuthorSocialProofDto),
    __metadata("design:type", author_social_proof_dto_1.AuthorSocialProofDto)
], CreateAuthorDto.prototype, "socialProof", void 0);
