// src/auth/cognito.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import axios from 'axios';
import jwkToPem from 'jwk-to-pem';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class CognitoStrategy extends PassportStrategy(Strategy, 'cognito') {
    constructor() {
        super({
            // Extrai o token do cabeçalho Authorization (Bearer token)
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            // O provider para obter a chave pública dinamicamente a partir do Cognito
            secretOrKeyProvider: async (request, rawJwtToken, done) => {
                try {
                    // Obtém a URL dos JWKS do Cognito a partir do .env
                    const jwksUrl = process.env.COGNITO_JWKS_URL;
                    if (!jwksUrl) {
                        return done(new UnauthorizedException('COGNITO_JWKS_URL não definida'), undefined);
                    }
                    // Busca as chaves do JWKS
                    const response = await axios.get(jwksUrl);
                    const keys = response.data.keys;

                    // Decodifica o token para extrair o "kid" (Key ID)
                    const decoded = jwt.decode(rawJwtToken, { complete: true });
                    if (!decoded || !decoded.header) {
                        return done(new UnauthorizedException('Token inválido'), null);
                    }
                    const kid = decoded.header.kid;
                    // Procura a chave que corresponda ao kid
                    const key = keys.find((k) => k.kid === kid);
                    if (!key) {
d                    }
                    // Converte o JWK para PEM
                    const pem = jwkToPem(key);
                    return done(null, pem);
                } catch (error) {
                    return done(error, null);
                }
            },
        });
    }

    async validate(payload: any) {
        if (!payload) {
            throw new UnauthorizedException();
        }
        // Aqui você pode adicionar validações extras (como verificar claims específicas)
        return payload;
    }
}
