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
const swagger_1 = require("@nestjs/swagger");
const posts_service_1 = require("./posts.service");
const create_post_dto_1 = require("./dto/create-post.dto");
const update_post_dto_1 = require("./dto/update-post.dto");
const list_posts_dto_1 = require("./dto/list-posts.dto");
const post_base_dto_1 = require("./dto/post-base.dto");
const cognito_auth_guard_1 = require("../../../auth/cognito-auth.guard");
const pipes_1 = require("@nestjs/common/pipes");
let PostsController = class PostsController {
    constructor(postsService) {
        this.postsService = postsService;
    }
    create(createPostDto) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.postsService.create(createPostDto);
                return this.formatResponse('Post criado com sucesso', result);
            }
            catch (error) {
                this.handleDynamoError(error, 'Erro ao criar post');
            }
        });
    }
    findAll(limit, lastKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const safeLimit = Math.min(limit || 20, 50);
                const result = yield this.postsService.findAll({
                    limit: safeLimit.toString(),
                    lastKey,
                });
                return this.formatPaginatedResponse(result);
            }
            catch (error) {
                this.handleDynamoError(error, 'Erro ao buscar posts');
            }
        });
    }
    findOne(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.postsService.findOne(id);
                return this.formatResponse('Post encontrado', result);
            }
            catch (error) {
                this.handleDynamoError(error, 'Post não encontrado', common_1.HttpStatus.NOT_FOUND);
            }
        });
    }
    update(id, updatePostDto) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.postsService.update(id, updatePostDto);
                return this.formatResponse('Post atualizado com sucesso', result);
            }
            catch (error) {
                this.handleDynamoError(error, 'Erro ao atualizar post');
            }
        });
    }
    remove(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.postsService.remove(id);
            }
            catch (error) {
                this.handleDynamoError(error, 'Erro ao excluir post');
            }
        });
    }
    handleDynamoError(error, defaultMessage, defaultStatus = common_1.HttpStatus.BAD_REQUEST) {
        const dynamoError = error;
        const errorMap = {
            ResourceNotFoundException: {
                status: common_1.HttpStatus.NOT_FOUND,
                message: 'Recurso não encontrado',
            },
            ProvisionedThroughputExceededException: {
                status: common_1.HttpStatus.TOO_MANY_REQUESTS,
                message: 'Limite de requisições excedido',
            },
            ConditionalCheckFailedException: {
                status: common_1.HttpStatus.CONFLICT,
                message: 'Conflito na versão do recurso',
            },
        };
        const errorName = dynamoError.name;
        const { status, message } = errorMap[errorName] || {
            status: defaultStatus,
            message: defaultMessage,
        };
        throw new common_1.HttpException({
            statusCode: status,
            message: `${message}: ${dynamoError.message}`,
            timestamp: new Date().toISOString()
        }, status);
    }
    formatResponse(message, data) {
        return {
            statusCode: common_1.HttpStatus.OK,
            message,
            data,
            timestamp: new Date().toISOString(),
        };
    }
    formatPaginatedResponse(result) {
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Posts recuperados com sucesso',
            data: result.data,
            meta: Object.assign(Object.assign({}, result.meta), { timestamp: new Date().toISOString() }),
        };
    }
};
exports.PostsController = PostsController;
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Criar novo post' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Post criado com sucesso',
        type: post_base_dto_1.PostBaseDto
    }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.BAD_REQUEST, description: 'Dados inválidos' }),
    (0, common_1.UseGuards)(cognito_auth_guard_1.CognitoAuthGuard),
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_post_dto_1.CreatePostDto]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Listar posts paginados' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Limite de resultados (máx 50)' }),
    (0, swagger_1.ApiQuery)({ name: 'lastKey', required: false, type: String, description: 'Chave para paginação' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Lista de posts recuperada',
        type: list_posts_dto_1.ListPostsDto
    }),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __param(1, (0, common_1.Query)('lastKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Obter post por ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Post encontrado',
        type: post_base_dto_1.PostBaseDto
    }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NOT_FOUND, description: 'Post não encontrado' }),
    (0, common_1.Get)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "findOne", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar post' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Post atualizado',
        type: post_base_dto_1.PostBaseDto
    }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NOT_FOUND, description: 'Post não encontrado' }),
    (0, common_1.UseGuards)(cognito_auth_guard_1.CognitoAuthGuard),
    (0, common_1.Put)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_post_dto_1.UpdatePostDto]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "update", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir post' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NO_CONTENT, description: 'Post excluído com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.NOT_FOUND, description: 'Post não encontrado' }),
    (0, common_1.UseGuards)(cognito_auth_guard_1.CognitoAuthGuard),
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "remove", null);
exports.PostsController = PostsController = __decorate([
    (0, swagger_1.ApiTags)('Posts'),
    (0, common_1.Controller)('posts'),
    (0, common_1.UsePipes)(new pipes_1.ValidationPipe({ transform: true, whitelist: true })),
    __metadata("design:paramtypes", [posts_service_1.PostsService])
], PostsController);
