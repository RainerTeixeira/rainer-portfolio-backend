import { ApiProperty } from '@nestjs/swagger';

export enum PostStatus {
    DRAFT = 'draft',
    PUBLISHED = 'published'
}

export class PostEntity {
    @ApiProperty({ description: 'ID único do post', example: 'mbx9zi-1a3' })
    postId: string;

    @ApiProperty({ description: 'ID da subcategoria', example: '2' })
    subcategoryId: string;

    @ApiProperty({ enum: PostStatus, example: PostStatus.PUBLISHED })
    status: PostStatus;

    @ApiProperty({ description: 'Slug do post', example: 'guia-definitivo-apis-nestjs-13' })
    slug: string;

    @ApiProperty({ description: 'Data de publicação', example: '2024-09-15T10:00:00Z' })
    publishDate: string;

    @ApiProperty({ description: 'Data de criação', example: '2024-09-10T08:00:00Z' })
    createdAt: string;

    @ApiProperty({ description: 'Data da última atualização', example: '2024-09-20T12:00:00Z' })
    updatedAt: string;

    @ApiProperty({ description: 'Número de visualizações', example: 2500 })
    views: number;

    @ApiProperty({ description: 'Conteúdo HTML do post' })
    contentHTML: string;

    @ApiProperty({ description: 'Título do post', example: 'Guia Definitivo: Construindo APIs Escaláveis com NestJS' })
    title: string;

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

    @ApiProperty({ description: 'Tags associadas ao post', example: ['APIs', 'Backend', 'NestJS', 'TypeScript'] })
    tags: string[];
}