// src/auth/cognito.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import axios from 'axios';
import jwkToPem from 'jwk-to-pem';
import * as jwt from 'jsonwebtoken';

/**
 * Estratégia de autenticação Cognito utilizando JWT.
 */
@Injectable()
export class CognitoStrategy extends PassportStrategy(Strategy, 'cognito') {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKeyProvider: async (request, rawJwtToken, done) => {
                try {
                    const jwksUrl = process.env.COGNITO_JWKS_URL;
                    if (!jwksUrl) {
                        return done(new UnauthorizedException('COGNITO_JWKS_URL não definida'), undefined);
                    }

                    const response = await axios.get(jwksUrl);
                    const keys = response.data.keys;

                    const decoded = jwt.decode(rawJwtToken, { complete: true });
                    if (!decoded?.header?.kid) {
                        return done(new UnauthorizedException('Token inválido'), undefined);
                    }
                    const { kid } = decoded.header;

                    // Add type annotation to the callback parameter
                    const key = keys.find((k: any) => k.kid === kid);
                    if (!key) {
                        return done(new UnauthorizedException('Chave pública não encontrada'), undefined);
                    }

                    const pem = jwkToPem(key);
                    return done(null, pem);
                } catch (error) {
                    return done(error, undefined);
                }
            },
        });
    }

    /**
     * Valida o payload do token JWT.
     * 
     * @param payload - Payload do token JWT.
     * @returns O payload validado.
     * @throws UnauthorizedException se o payload for inválido.
     */
    async validate(payload: any) {
        if (!payload) {
            throw new UnauthorizedException();
        }
        return payload;
    }
}