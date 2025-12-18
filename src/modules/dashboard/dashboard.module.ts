/**
 * Módulo de Dashboard
 * 
 * Módulo NestJS para dashboard com estatísticas e analytics.
 * 
 * @module modules/dashboard/dashboard.module
 */

import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';

/**
 * Módulo de Dashboard
 * 
 * Providers:
 * - DashboardService: Lógica de negócio para estatísticas e analytics
 * 
 * Controllers:
 * - DashboardController: Rotas de dashboard (/api/dashboard/stats, /api/dashboard/analytics)
 */
@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

