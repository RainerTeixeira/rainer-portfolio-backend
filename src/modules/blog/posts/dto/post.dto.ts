// src/modules/blog/posts/dto/post.dto.ts
import { PostInfoDto } from './post-info.dto';
import { PostSeoDto } from './post-seo.dto';

/**
 * DTO principal para representar um Post.
 * Reflete a estrutura de um post no banco de dados, incluindo chave primária composta e objetos aninhados.
 */
export class PostDto {
    'categoryId#subcategoryId': string; // Chave de Partição Composta (categoryId#subcategoryId)
    postId: string; // Chave de Classificação (postId)
    categoryId: string;
    subcategoryId: string;
    contentHTML: string;
    postInfo: PostInfoDto; // Objeto aninhado para informações do post
    seo?: PostSeoDto; // Objeto aninhado para SEO

    /**
     * Construtor para PostDto.
     * Inicializa as propriedades do DTO quando um objeto PostDto é criado.
     */
    constructor(
        categoryIdSubcategoryId: string,
        postId: string,
        categoryId: string,
        subcategoryId: string,
        contentHTML: string,
        postInfo?: PostInfoDto,
        seo?: PostSeoDto,
    ) {
        this['categoryId#subcategoryId'] = categoryIdSubcategoryId;
        this.postId = postId;
        this.categoryId = categoryId;
        this.subcategoryId = subcategoryId;
        this.contentHTML = contentHTML;
        this.postInfo = postInfo;
        this.seo = seo;
    }
}