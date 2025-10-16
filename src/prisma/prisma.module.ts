/**
 * Prisma Module
 * 
 * Módulo NestJS que exporta o PrismaService.
 * Configurado como global para ser acessível em toda a aplicação.
 * 
 * @module prisma/prisma.module
 */

import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * Módulo global do Prisma
 * 
 * @Global() - Torna o módulo disponível em toda a aplicação sem precisar importar
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

