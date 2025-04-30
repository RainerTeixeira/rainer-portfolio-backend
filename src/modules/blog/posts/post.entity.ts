// src/modules/blog/posts/post.entity.ts
import { ApiProperty } from '@nestjs/swagger';

/**
 * Entidade que representa um post de blog no domínio da aplicação.
 * Utilizada para mapear os dados armazenados no DynamoDB e expor propriedades relevantes para a aplicação.
 * Inclui campos para integração com índices secundários globais (GSI) e propriedades de SEO.
 */
export class PostEntity {
    @ApiProperty({ description: 'Chave de partição no formato POST#id' })
    id: string;

    @ApiProperty({ description: 'Chave de classificação fixa METADATA' })
    metadata: string = 'METADATA';

    @ApiProperty({ description: 'ID do autor' })
    authorId: string;

    @ApiProperty({ description: 'ID da categoria' })
    categoryId: string;

    @ApiProperty({ description: 'Número de comentários' })
    commentCount: number;

    @ApiProperty({ description: 'Conteúdo do post' })
    content: string;

    @ApiProperty({ description: 'Data de criação do post' })
    createdAt: string;

    @ApiProperty({ description: 'Resumo/trecho do post' })
    excerpt: string;

    @ApiProperty({ description: 'Data da última atualização do post' })
    lastUpdatedDate: string;

    @ApiProperty({ description: 'Número de likes' })
    likes: number;

    @ApiProperty({ description: 'Meta descrição para SEO' })
    metaDescription: string;

    @ApiProperty({ description: 'Descrição para Open Graph' })
    ogDescription: string;

    @ApiProperty({ description: 'URL da imagem Open Graph' })
    ogImage: string;

    @ApiProperty({ description: 'Título para Open Graph' })
    ogTitle: string;

    @ApiProperty({ description: 'URL da imagem do post' })
    postPictureUrl: string;

    @ApiProperty({ description: 'Data de publicação do post' })
    publishDate: string;

    @ApiProperty({ description: 'Slug do post' })
    slug: string;

    @ApiProperty({ description: 'Status do post' })
    status: string;

    @ApiProperty({ description: 'Subcategoria do post' })
    subcategory: string;

    @ApiProperty({ description: 'Tags do post', type: [String] })
    tags: string[];

    @ApiProperty({ description: 'Título do post' })
    title: string;

    @ApiProperty({ description: 'Tipo do registro (POST)' })
    type: string = 'POST';

    @ApiProperty({ description: 'Número de visualizações' })
    views: number;

    @ApiProperty({
        description: 'Propriedades do GSI_AuthorPosts',
        type: 'object',
        properties: { authorId: { type: 'string' }, publishDate: { type: 'string' } }
    })
    a?: { authorId: string; publishDate: string };

    @ApiProperty({
        description: 'Propriedades do GSI_CategoryPosts',
        type: 'object',
        properties: { categoryId: { type: 'string' }, views: { type: 'number' } }
    })
    b?: { categoryId: string; views: number };

    @ApiProperty({
        description: 'Propriedades do GSI_RecentPosts',
        type: 'object',
        properties: { type: { type: 'string' }, publishDate: { type: 'string' } }
    })
    c?: { type: string; publishDate: string };

    @ApiProperty({
        description: 'Propriedades do GSI_Slug',
        type: 'object',
        properties: { slug: { type: 'string' }, type: { type: 'string' } }
    })
    d?: { slug: string; type: string };

    /**
     * Construtor que permite inicializar a entidade a partir de um objeto parcial.
     * @param partial Objeto parcial para inicialização.
     */
    constructor(partial?: Partial<PostEntity>) {
        Object.assign(this, partial);
    }
}
