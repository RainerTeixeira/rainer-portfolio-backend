import { ApiProperty } from '@nestjs/swagger';
import { CommentDto } from '@src/modules/blog/comments/dto/base-comment.dto';

/**
 * DTO que representa um post completo no sistema.
 */
export class PostFullDto {
    @ApiProperty({ description: 'ID do post', example: 'mbx9zi-1a3' })
    postId: string;

    @ApiProperty({ description: 'Título do post', example: 'Guia Definitivo: Construindo APIs Escaláveis com NestJS' })
    title: string;

    @ApiProperty({ description: 'Slug do post', example: 'guia-definitivo-apis-nestjs-13' })
    slug: string;

    @ApiProperty({ description: 'Conteúdo HTML do post' })
    contentHTML: string;

    @ApiProperty({ description: 'Descrição breve do post', example: 'Descubra como utilizar NestJS para desenvolver APIs escaláveis...' })
    description: string;

    @ApiProperty({ description: 'URL canônica do post', example: 'https://meusite.com/blog/guia-definitivo-apis-nestjs' })
    canonical: string;

    @ApiProperty({ description: 'URL da imagem destacada', example: 'url-imagem-destaque-nestjs.jpg' })
    featuredImageURL: string;

    @ApiProperty({ description: 'Palavras-chave para SEO', example: ['API escalável', 'Backend seguro', 'NestJS', 'TypeScript'] })
    keywords: string[];

    @ApiProperty({ description: 'Tempo estimado de leitura em minutos', example: 8 })
    readingTime: number;

    @ApiProperty({ description: 'Status do post', example: 'published' })
    status: string;

    @ApiProperty({ description: 'Data de publicação do post (ISO 8601)', example: '2024-09-15T10:00:00Z' })
    publishDate: string;

    @ApiProperty({ description: 'Data de modificação do post (ISO 8601)', example: '2024-09-20T12:00:00Z' })
    modifiedDate: string;

    @ApiProperty({ description: 'Número de visualizações do post', example: 2500 })
    views: number;

    @ApiProperty({ description: 'ID da categoria', example: '1' })
    categoryId: string;

    @ApiProperty({ description: 'ID da subcategoria', example: '2' })
    subcategoryId: string;

    @ApiProperty({ description: 'ID do autor do post', example: '1' })
    authorId: string;

    @ApiProperty({ type: [CommentDto], description: 'Comentários associados ao post' })
    comments: CommentDto[];
}