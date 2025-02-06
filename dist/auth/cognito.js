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
exports.AuthModule = exports.CognitoAuthService = void 0;
const aws_jwt_verify_1 = require("aws-jwt-verify");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let CognitoAuthService = class CognitoAuthService {
    constructor(configService) {
        this.configService = configService;
        const userPoolId = this.configService.get('COGNITO_USER_POOL_ID');
        const clientId = this.configService.get('COGNITO_CLIENT_ID');
        if (!userPoolId || !clientId) {
            throw new Error('COGNITO_USER_POOL_ID ou COGNITO_CLIENT_ID não estão configurados nas variáveis de ambiente');
        }
        this.verifier = aws_jwt_verify_1.CognitoJwtVerifier.create({
            userPoolId: userPoolId,
            tokenUse: 'id', // Aqui o "id" se refere ao tipo de token: ID Token
            clientId: clientId,
        });
    }
    // Método para verificar o token
    verifyToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.verifier.verify(token); // Verificando o token JWT
            }
            catch (error) {
                // Log de erro e lançamento de exceção
                console.error('Erro ao verificar o token:', error);
                throw new common_1.UnauthorizedException('Token inválido ou expirado');
            }
        });
    }
    // Método para obter as configurações do Cognito
    getCognitoConfig() {
        return {
            region: this.configService.get('DYNAMODB_REGION'),
            accessKeyId: this.configService.get('DYNAMODB_ACCESS_KEY_ID'),
            secretAccessKey: this.configService.get('DYNAMODB_SECRET_ACCESS_KEY'),
            userPoolId: this.configService.get('COGNITO_USER_POOL_ID'),
            clientId: this.configService.get('COGNITO_CLIENT_ID'),
            jwksUrl: this.configService.get('COGNITO_JWKS_URL'),
        };
    }
};
exports.CognitoAuthService = CognitoAuthService;
exports.CognitoAuthService = CognitoAuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CognitoAuthService);
// A classe AuthModule deve estar fora da classe CognitoAuthService
class AuthModule {
}
exports.AuthModule = AuthModule;
