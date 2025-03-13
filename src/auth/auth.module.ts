// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CognitoStrategy } from './cognito.strategy';

/**
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
    imports: [PassportModule.register({ defaultStrategy: 'cognito' })],
    providers: [CognitoStrategy],
    exports: [PassportModule],
})
export class AuthModule { }
