// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { CognitoStrategy } from './cognito.strategy';
import { CognitoAuthGuard } from './cognito-auth.guard';

/**
 * Módulo de autenticação que configura a estratégia de autenticação Cognito.
 * 
 * @swagger
 * components:
 *   securitySchemes:
 *     cognitoAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT Authorization header using the Bearer scheme.
 * 
 * security:
 *   - cognitoAuth: []
 */
@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'cognito' }),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '60s' },
        }),
        ConfigModule,
    ],
    providers: [CognitoStrategy, CognitoAuthGuard],
    exports: [PassportModule, CognitoStrategy, CognitoAuthGuard],
})
export class AuthModule { }
