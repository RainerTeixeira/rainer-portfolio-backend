/**
 * @fileoverview Controller de Dashboard
 *
 * Endpoints HTTP para estatísticas e analytics do dashboard.
 *
 * Papel deste controller:
 * - Expor rotas de leitura (GET) para o painel administrativo.
 * - Delegar agregações/cálculos ao `DashboardService`.
 * - Padronizar envelopes de resposta `{ success: true, data }`.
 *
 * @module modules/dashboard/controllers/dashboard.controller
 */

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import type { DashboardStats, DashboardAnalytics } from '../dto/dashboard.model';

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
@ApiTags('dashboard')
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Retorna estatísticas gerais do dashboard.
   *
   * Endpoint:
   * - `GET /api/dashboard/stats`
   *
   * @returns {Promise<{ success: true; data: DashboardStats }>} Estatísticas agregadas.
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
   * Retorna dados de analytics para o período especificado.
   *
   * Endpoint:
   * - `GET /api/dashboard/analytics`
   *
   * @param {string} [_period] Período de análise (ex.: `7d`, `30d`, `90d`).
   * @returns {Promise<{ success: true; data: DashboardAnalytics }>} Dados de views e engajamento.
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
    @Query('period') _period?: string,
  ): Promise<{ success: true; data: DashboardAnalytics }> {
    // TODO: Implementar com período quando a nova arquitetura estiver pronta
    const analytics = await this.dashboardService.getAnalytics();
    return { success: true, data: analytics };
  }
}
