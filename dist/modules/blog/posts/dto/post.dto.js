"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostDto = void 0;
/**
 * DTO principal para representar um Post.
 * Reflete a estrutura de um post no banco de dados, incluindo chave primária composta e objetos aninhados.
 */
class PostDto {
    /**
     * Construtor para PostDto.
     * Inicializa as propriedades do DTO quando um objeto PostDto é criado.
     */
    constructor(categoryIdSubcategoryId, postId, categoryId, subcategoryId, contentHTML, postInfo, seo) {
        this['categoryId#subcategoryId'] = categoryIdSubcategoryId;
        this.postId = postId;
        this.categoryId = categoryId;
        this.subcategoryId = subcategoryId;
        this.contentHTML = contentHTML;
        this.postInfo = postInfo;
        this.seo = seo;
    }
}
exports.PostDto = PostDto;
