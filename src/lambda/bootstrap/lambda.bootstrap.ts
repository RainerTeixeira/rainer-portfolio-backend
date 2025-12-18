/**
 * @fileoverview Bootstrap do NestJS para AWS Lambda
 * 
 * Inicializa a aplicação NestJS dentro do ambiente Lambda.
 * Reutiliza a instância entre invocações (warm start) para performance.
 * 
 * @module lambda/bootstrap/lambda.bootstrap
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from '../../app.module';

/**
 * Instância da aplicação NestJS reutilizada.
 * 
 * @type {INestApplication}
 */
let app: INestApplication | null = null;

/**
 * Inicializa ou reutiliza a aplicação NestJS.
 * 
 * @async
 * @function bootstrap
 * @returns {Promise<INestApplication>} Aplicação NestJS inicializada
 * 
 * @example
 * ```typescript
 * const app = await bootstrap();
 * await app.listen(3000);
 * ```
 */
export async function bootstrap(): Promise<INestApplication> {
  // Warm start: reutiliza instância existente
  if (app) {
    return app;
  }

  // Cold start: cria nova instância
  const adapter = new FastifyAdapter();
  
  const instance = await NestFactory.create(AppModule, adapter, {
    logger: ['error', 'warn'], // Reduz logs em produção
  });

  // Configuração de versão da API
  instance.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v1',
  });

  // Pipes globais
  instance.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  // CORS
  instance.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Prefixo global
  instance.setGlobalPrefix('api');

  app = instance;
  return app;
}

/**
 * Limpa recursos da aplicação.
 * 
 * @function cleanup
 * @returns {Promise<void>}
 */
export async function cleanup(): Promise<void> {
  if (app) {
    await app.close();
    app = null;
  }
}
