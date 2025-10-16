/**
 * Modelo de Like
 * 
 * Define a estrutura de dados para curtidas em posts.
 * Relação N:N entre User e Post.
 * 
 * @module modules/likes/like.model
 */

export interface Like {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
}

export interface CreateLikeData {
  userId: string;
  postId: string;
}

