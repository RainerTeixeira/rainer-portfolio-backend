/**
 * Módulo de Dashboard
 * 
 * Módulo NestJS para dashboard com estatísticas e analytics.
 * 
 * @module modules/dashboard/dashboard.module
 */

import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { DatabaseProviderModule } from '../../utils/database-provider/index.js';

/**
 * Módulo de Dashboard
 * 
 * Providers:
 * - DashboardService: Lógica de negócio para estatísticas e analytics
 * - PrismaService: Acesso ao banco de dados
 * 
 * Controllers:
 * - DashboardController: Rotas de dashboard (/api/dashboard/stats, /api/dashboard/analytics)
 */
@Module({
  imports: [DatabaseProviderModule],
  controllers: [DashboardController],
  providers: [DashboardService, PrismaService],
  exports: [DashboardService],
})
export class DashboardModule {}

