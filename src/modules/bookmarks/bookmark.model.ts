/**
 * Modelo de Bookmark
 * 
 * Define a estrutura de dados para posts salvos pelos usuários.
 * Suporta coleções personalizadas e notas.
 * 
 * @module modules/bookmarks/bookmark.model
 */

export interface Bookmark {
  id: string;
  userId: string;
  postId: string;
  collection?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookmarkData {
  userId: string;
  postId: string;
  collection?: string;
  notes?: string;
}

export interface UpdateBookmarkData {
  collection?: string;
  notes?: string;
}

