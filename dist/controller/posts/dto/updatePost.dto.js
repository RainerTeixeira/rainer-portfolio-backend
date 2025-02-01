"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePostDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const createPost_dto_1 = require("./createPost.dto");
class UpdatePostDto extends (0, swagger_1.PartialType)(createPost_dto_1.CreatePostDto) {
}
exports.UpdatePostDto = UpdatePostDto;
//# sourceMappingURL=updatePost.dto.js.map