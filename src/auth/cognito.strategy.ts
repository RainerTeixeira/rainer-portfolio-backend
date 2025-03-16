// src/auth/cognito.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as CognitoStrategy } from 'passport-cognito';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CognitoStrategy extends PassportStrategy(CognitoStrategy, 'cognito') {
  constructor(private readonly configService: ConfigService) {
    super({
      userPoolId: configService.get<string>('COGNITO_USER_POOL_ID'),
      clientId: configService.get<string>('COGNITO_CLIENT_ID'),
      region: configService.get<string>('AWS_REGION'),
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}