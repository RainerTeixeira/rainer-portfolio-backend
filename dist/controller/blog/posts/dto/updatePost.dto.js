"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePostDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const createPost_dto_1 = require("./createPost.dto");
class UpdatePostDto extends (0, mapped_types_1.PartialType)(createPost_dto_1.CreatePostDto) {
}
exports.UpdatePostDto = UpdatePostDto;
