/**
 * Modelo de Dashboard
 * 
 * Define as interfaces e tipos para dados do dashboard.
 * 
 * @module modules/dashboard/dashboard.model
 */

/**
 * Estatísticas gerais do dashboard
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
 * Dados de visualizações por data
 */
export interface ViewsData {
  date: string;
  views: number;
  uniqueViews?: number;
}

/**
 * Dados de engajamento por data
 */
export interface EngagementData {
  date: string;
  likes: number;
  comments: number;
}

/**
 * Dados de analytics do dashboard
 */
export interface DashboardAnalytics {
  views: ViewsData[];
  engagement: EngagementData[];
}

/**
 * Período para análise de analytics
 */
export type AnalyticsPeriod = '7d' | '30d' | '90d';

