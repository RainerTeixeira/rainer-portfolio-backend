// src/controller/blog/posts/dto/ListPostsDto.dto.ts

export class ListPostsDto {
  data: {
    postId: number;
    postDate: string;
    postTitle: string;
    postContent: string;
    postSummary: string;
    postLastUpdated: string;
    postReadingTime: number;
    postStatus: number;
    postTags: string[];
    postImages: string[];
    postVideoEmbedUrls: string[];
    references: { referenceId: number; title: string; url: string }[];
    relatedPosts: number[];
    comments: number[];
    authorIds: number[];
    category: { CategoryId: number; subCategoryId: number };
    sections: {
      sectionId: number;
      title: string;
      content: string;
      type: string;
    }[];
    seo: { canonicalUrl: string; description: string; keywords: string[] };
    viewsCount: number;
  }[];

  meta: {
    count: number; // Quantidade de posts retornados
    totalPages?: number; // Se estiver usando paginação baseada em páginas
    nextCursor?: string | null; // Para paginação baseada em cursor
  };
}
