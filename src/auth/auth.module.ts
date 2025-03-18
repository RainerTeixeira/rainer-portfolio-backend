import { Module } from '@nestjs/common';
import { CognitoAuthGuard } from './cognito-auth.guard';
import { ConfigModule } from '@nestjs/config';

/**
 * Módulo responsável por fornecer as configurações e o guard de autenticação via Cognito.
 * 
 * @module AuthModule
 * 
 * Este módulo importa o ConfigModule para acesso às variáveis de ambiente e disponibiliza o
 * CognitoAuthGuard para ser utilizado em outros módulos, garantindo que endpoints protegidos
 * possam validar os tokens JWT emitidos pelo Cognito.
 */
@Module({
    imports: [ConfigModule],
    providers: [CognitoAuthGuard],
    exports: [CognitoAuthGuard],
})
export class AuthModule { }
