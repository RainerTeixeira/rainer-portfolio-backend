import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Adicionar importação do ConfigModule
import { AuthService } from './auth.service'; // Certifique-se de que este caminho está correto
import { AuthController } from './auth.controller'; // Certifique-se de que este caminho está correto
import { PassportModule } from '@nestjs/passport';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CognitoAuthGuard } from './cognito-auth.guard';

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
  imports: [
    ConfigModule.forRoot(), // Adicionar ConfigModule para carregar variáveis de ambiente
    PassportModule.register({ defaultStrategy: 'jwt' }),

  ],
  controllers: [AuthController], // Certifique-se de que o AuthController está listado aqui
  providers: [AuthService, LocalAuthGuard, CognitoAuthGuard],
  exports: [AuthService],
})
export class AuthModule {
}
