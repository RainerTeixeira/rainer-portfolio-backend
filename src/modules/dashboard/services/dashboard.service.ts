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
import type { DashboardAnalytics, DashboardStats } from '../dto/dashboard.model';

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
   * Por que este método pode retornar dados "zerados" hoje:
   * - Enquanto as tabelas/consultas definitivas (Mongo/Dynamo) não estiverem fechadas,
   *   o dashboard precisa de um contrato estável para o frontend integrar.
   * - Assim, o service mantém o formato do payload e a implementação evolui depois.
   *
   * @returns {Promise<DashboardAnalytics>} Série temporal de views e engajamento.
   */
  async getAnalytics(): Promise<DashboardAnalytics> {
    // TODO: Implement with new database architecture
    return {
      views: [],
      engagement: [],
    };
  }
}
