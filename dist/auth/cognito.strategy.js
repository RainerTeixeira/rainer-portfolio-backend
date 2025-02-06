"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CognitoStrategy = void 0;
// src/auth/cognito.strategy.ts
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const axios_1 = __importDefault(require("axios"));
const jwk_to_pem_1 = __importDefault(require("jwk-to-pem"));
const jwt = __importStar(require("jsonwebtoken"));
let CognitoStrategy = class CognitoStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'cognito') {
    constructor() {
        super({
            // Extrai o token do cabeçalho Authorization (Bearer token)
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            // O provider para obter a chave pública dinamicamente a partir do Cognito
            secretOrKeyProvider: (request, rawJwtToken, done) => __awaiter(this, void 0, void 0, function* () {
                try {
                    // Obtém a URL dos JWKS do Cognito a partir do .env
                    const jwksUrl = process.env.COGNITO_JWKS_URL;
                    if (!jwksUrl) {
                        return done(new common_1.UnauthorizedException('COGNITO_JWKS_URL não definida'), undefined);
                    }
                    // Busca as chaves do JWKS
                    const response = yield axios_1.default.get(jwksUrl);
                    const keys = response.data.keys;
                    // Decodifica o token para extrair o "kid" (Key ID)
                    const decoded = jwt.decode(rawJwtToken, { complete: true });
                    if (!decoded || !decoded.header) {
                        return done(new common_1.UnauthorizedException('Token inválido'), null);
                    }
                    const kid = decoded.header.kid;
                    // Procura a chave que corresponda ao kid
                    const key = keys.find((k) => k.kid === kid);
                    if (!key) {
                        d;
                    }
                    // Converte o JWK para PEM
                    const pem = (0, jwk_to_pem_1.default)(key);
                    return done(null, pem);
                }
                catch (error) {
                    return done(error, null);
                }
            }),
        });
    }
    validate(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!payload) {
                throw new common_1.UnauthorizedException();
            }
            // Aqui você pode adicionar validações extras (como verificar claims específicas)
            return payload;
        });
    }
};
exports.CognitoStrategy = CognitoStrategy;
exports.CognitoStrategy = CognitoStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CognitoStrategy);
