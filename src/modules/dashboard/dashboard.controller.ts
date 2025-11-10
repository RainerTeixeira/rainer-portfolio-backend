/**
 * Controlador de Dashboard
 * 
 * Endpoints para estatísticas e analytics do dashboard.
 * 
 * @module modules/dashboard/dashboard.controller
 */

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service.js';
import type { DashboardStats, DashboardAnalytics, AnalyticsPeriod } from './dashboard.model.js';

/**
 * Controller de Dashboard
 * Expõe endpoints para estatísticas e analytics.
 *
 * Convenções:
 * - Retornos padronizados: `{ success: true, data }`.
 * - Endpoints: `GET /api/dashboard/stats` e `GET /api/dashboard/analytics`.
 *
 * Integração Swagger:
 * - `@ApiTags`, `@ApiOperation`, `@ApiQuery` e `@ApiResponse` com schemas e exemplos.
 *
 */
@ApiTags('Dashboard')
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /api/dashboard/stats
   * 
   * Retorna estatísticas gerais do dashboard.
   * 
   * @returns Estatísticas agregadas
   */
  @Get('stats')
  @ApiOperation({ summary: '📊 Obter Estatísticas do Dashboard' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estatísticas retornadas com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            totalPosts: { type: 'number', example: 24 },
            totalViews: { type: 'number', example: 12500 },
            totalLikes: { type: 'number', example: 847 },
            totalComments: { type: 'number', example: 234 },
            postsChange: { type: 'number', example: 20.1 },
            viewsChange: { type: 'number', example: 15.3 },
            likesChange: { type: 'number', example: 12.5 },
            commentsChange: { type: 'number', example: 8.2 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async getStats(): Promise<{ success: true; data: DashboardStats }> {
    const stats = await this.dashboardService.getStats();
    return { success: true, data: stats };
  }

  /**
   * GET /api/dashboard/analytics
   * 
   * Retorna dados de analytics para o período especificado.
   * 
   * @param period - Período de análise (7d, 30d ou 90d)
   * @returns Dados de views e engajamento
   */
  @Get('analytics')
  @ApiOperation({ summary: '📈 Obter Analytics do Dashboard' })
  @ApiQuery({ 
    name: 'period', 
    required: false, 
    enum: ['7d', '30d', '90d'],
    description: 'Período de análise',
    example: '30d',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Analytics retornados com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            views: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', example: '2025-01-01' },
                  views: { type: 'number', example: 150 },
                  uniqueViews: { type: 'number', example: 105 },
                },
              },
            },
            engagement: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', example: '2025-01-01' },
                  likes: { type: 'number', example: 10 },
                  comments: { type: 'number', example: 5 },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async getAnalytics(
    @Query('period') period?: string,
  ): Promise<{ success: true; data: DashboardAnalytics }> {
    const analyticsPeriod = (period as AnalyticsPeriod) || '30d';
    const analytics = await this.dashboardService.getAnalytics(analyticsPeriod);
    return { success: true, data: analytics };
  }
}

