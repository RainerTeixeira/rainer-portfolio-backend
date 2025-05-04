// src/modules/blog/posts/post.entity.ts

/**
 * Entidade que representa um post de blog no domínio da aplicação.
 * Utilizada para mapear os dados armazenados no DynamoDB e expor propriedades relevantes para a aplicação.
 * Inclui campos para integração com índices secundários globais (GSI) e propriedades de SEO.
 */
export class PostEntity {
    /** Chave de partição no formato POST#id */
    id: string;

    /** Chave de classificação fixa METADATA */
    metadata: string = 'METADATA';

    /** ID do autor */
    authorId: string;

    /** ID da categoria */
    categoryId: string;

    /** Número de comentários */
    commentCount: number;

    /** Conteúdo do post */
    content: string;

    /** Data de criação do post */
    createdAt: string;

    /** Resumo/trecho do post */
    excerpt: string;

    /** Data da última atualização do post */
    lastUpdatedDate: string;

    /** Número de likes */
    likes: number;

    /** Meta descrição para SEO */
    metaDescription: string;

    /** Descrição para Open Graph */
    ogDescription: string;

    /** URL da imagem Open Graph */
    ogImage: string;

    /** Título para Open Graph */
    ogTitle: string;

    /** URL da imagem do post */
    postPictureUrl: string;

    /** Data de publicação do post */
    publishDate: string;

    /** Slug do post */
    slug: string;

    /** Status do post */
    status: string;

    /** Subcategoria do post */
    subcategory: string;

    /** Tags do post */
    tags: string[];

    /** Título do post */
    title: string;

    /** Tipo do registro (POST) */
    type: string = 'POST';

    /** Número de visualizações */
    views: number;

    /** Propriedades do GSI_AuthorPosts */
    a?: { authorId: string; publishDate: string };

    /** Propriedades do GSI_CategoryPosts */
    b?: { categoryId: string; views: number };

    /** Propriedades do GSI_RecentPosts */
    c?: { type: string; publishDate: string };

    /** Propriedades do GSI_Slug */
    d?: { slug: string; type: string };

    /**
     * Construtor que permite inicializar a entidade a partir de um objeto parcial.
     * @param partial Objeto parcial para inicialização.
     */
    constructor(partial?: Partial<PostEntity>) {
        Object.assign(this, partial);
    }
}
