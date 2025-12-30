/**
 * @fileoverview Tipos/Interfaces de Dashboard
 *
 * Define interfaces e tipos usados em respostas do dashboard.
 *
 * Esses tipos descrevem:
 * - Estatísticas agregadas (contadores e variações).
 * - Séries temporais de views e engajamento.
 * - Períodos suportados para consulta.
 *
 * @module modules/dashboard/dto/dashboard.model
 */

/**
 * Estatísticas gerais do dashboard.
 */
export interface DashboardStats {
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  postsChange?: number;
  viewsChange?: number;
  likesChange?: number;
  commentsChange?: number;
}

/**
 * Série de visualizações por data.
 */
export interface ViewsData {
  date: string;
  views: number;
  uniqueViews?: number;
}

/**
 * Série de engajamento por data.
 */
export interface EngagementData {
  date: string;
  likes: number;
  comments: number;
}

/**
 * Dados de analytics do dashboard.
 */
export interface DashboardAnalytics {
  views: ViewsData[];
  engagement: EngagementData[];
}

/**
 * Período para análise de analytics.
 */
export type AnalyticsPeriod = '7d' | '30d' | '90d';

