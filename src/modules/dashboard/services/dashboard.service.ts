/**
 * @fileoverview Serviço de Dashboard
 *
 * Serviço responsável por fornecer dados agregados para o dashboard (estatísticas
 * e analytics). Nesta etapa do projeto, a implementação pode estar stubada
 * (retornando zeros/listas vazias) enquanto a arquitetura de banco é consolidada.
 *
 * @module modules/dashboard/services/dashboard.service
 */

import { Injectable } from '@nestjs/common';

/**
 * Estrutura de estatísticas agregadas do dashboard.
 *
 * Observação: há também um tipo exportado em `../dto/dashboard.model`.
 * Aqui existe uma interface local para tipagem interna do service.
 */
interface DashboardStats {
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  postsChange: number;
  viewsChange: number;
  likesChange: number;
  commentsChange: number;
}

@Injectable()
export class DashboardService {
  /**
   * Retorna estatísticas gerais do dashboard.
   *
   * @returns {Promise<DashboardStats>} Estatísticas agregadas.
   */
  async getStats(): Promise<DashboardStats> {
    // TODO: Implement with new database architecture
    return {
      totalPosts: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      postsChange: 0,
      viewsChange: 0,
      likesChange: 0,
      commentsChange: 0,
    };
  }

  /**
   * Retorna dados de analytics do dashboard.
   *
   * @returns {Promise<{ views: unknown[]; engagement: unknown[]; topPosts: unknown[]; recentActivity: unknown[] }>} Payload de analytics.
   */
  async getAnalytics() {
    // TODO: Implement with new database architecture
    return {
      views: [],
      engagement: [],
      topPosts: [],
      recentActivity: [],
    };
  }
}
