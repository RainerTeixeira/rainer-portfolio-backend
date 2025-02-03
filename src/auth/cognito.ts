import { CognitoJwtVerifier } from "aws-jwt-verify";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class CognitoAuthService {
    private verifier;

    constructor(private readonly configService: ConfigService) {
        const userPoolId = this.configService.get<string>("COGNITO_USER_POOL_ID");
        const clientId = this.configService.get<string>("COGNITO_CLIENT_ID");

        if (!userPoolId || !clientId) {
            throw new Error("COGNITO_USER_POOL_ID ou COGNITO_CLIENT_ID não estão configurados nas variáveis de ambiente");
        }

        this.verifier = CognitoJwtVerifier.create({
            userPoolId: userPoolId,
            tokenUse: "id", // Aqui o "id" se refere ao tipo de token: ID Token
            clientId: clientId,
        });
    }

    // Método para verificar o token
    async verifyToken(token: string): Promise<any> {
        try {
            return await this.verifier.verify(token);  // Verificando o token JWT
        } catch (error) {
            // Log de erro e lançamento de exceção
            console.error("Erro ao verificar o token:", error);
            throw new UnauthorizedException("Token inválido ou expirado");
        }
    }

    // Método para obter as configurações do Cognito
    getCognitoConfig() {
        return {
            region: this.configService.get<string>("DYNAMODB_REGION"),
            accessKeyId: this.configService.get<string>("DYNAMODB_ACCESS_KEY_ID"),
            secretAccessKey: this.configService.get<string>("DYNAMODB_SECRET_ACCESS_KEY"),
            userPoolId: this.configService.get<string>("COGNITO_USER_POOL_ID"),
            clientId: this.configService.get<string>("COGNITO_CLIENT_ID"),
            jwksUrl: this.configService.get<string>("COGNITO_JWKS_URL"),
        };
    }
}

// A classe AuthModule deve estar fora da classe CognitoAuthService
export class AuthModule { }
