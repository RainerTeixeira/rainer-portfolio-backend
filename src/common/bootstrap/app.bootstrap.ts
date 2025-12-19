/**
 * @fileoverview Bootstrap Unificado da Aplicação
 * 
 * Configurações globais compartilhadas entre Server e Lambda.
 * Garante comportamento consistente em ambos os runtimes.
 * 
 * @module common/bootstrap/app.bootstrap
 * @version 1.0.0
 * @since 2025-12-18
 * @author Rainer Soft
 * @license MIT
 */

import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { server } from '../config';

/**
 * Aplica configurações globais padronizadas na aplicação NestJS.
 * 
 * Configurações aplicadas (IGUAIS para Server e Lambda):
 * - Prefixo global: /api
 * - Versionamento: URI (v1)
 * - ValidationPipe: whitelist: true, transform: true
 * - CORS: padronizado via config
 * 
 * @param app Instância da aplicação NestJS
 * 
 * @example
 * ```typescript
 * const app = await NestFactory.create(AppModule, adapter);
 * await applyGlobalAppConfig(app);
 * ```
 */
export async function applyGlobalAppConfig(app: INestApplication): Promise<void> {
  // Prefixo global - IGUAL para Server e Lambda
  app.setGlobalPrefix('api');

  // Versionamento via URI - IGUAL para Server e Lambda
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ValidationPipe global - PADRONIZADO para ambos os runtimes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS - mesma configuração para Server e Lambda
  app.enableCors({
    origin: server.corsOrigin || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}
