// src/auth/cognito-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard de autenticação que utiliza a estratégia Cognito.
 */
@Injectable()
export class CognitoAuthGuard extends AuthGuard('cognito') { }
