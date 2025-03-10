    import {
        IsString,
        IsNotEmpty,
        IsOptional,
        IsNumber,
        IsArray,
        IsUrl,
        IsISO8601,
        IsUUID,
    } from 'class-validator';
    import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

    /**
     * DTO para criação de um novo post.
     */
    export class CreatePostDto {
        @ApiProperty({ description: 'ID da categoria' })
        @IsUUID()
        @IsNotEmpty()
        categoryId: string;

        @ApiProperty({ description: 'ID da subcategoria' })
        @IsUUID()
        @IsNotEmpty()
        subcategoryId: string;

        @ApiProperty({ description: 'Conteúdo HTML do post' })
        @IsString()
        @IsNotEmpty()
        contentHTML: string;

        @ApiProperty({ description: 'ID do autor' })
        @IsUUID()
        @IsNotEmpty()
        authorId: string;

        @ApiProperty({ description: 'Data de publicação (ISO 8601)' })
        @IsISO8601()
        @IsNotEmpty()
        publishDate: string;

        @ApiProperty({ description: 'Slug único para URL' })
        @IsString()
        @IsNotEmpty()
        slug: string;

        @ApiProperty({ description: 'Título do post' })
        @IsString()
        @IsNotEmpty()
        title: string;

        @ApiPropertyOptional({ description: 'URL da imagem destacada' })
        @IsUrl()
        @IsOptional()
        featuredImageURL?: string;

        @ApiPropertyOptional({ description: 'Tempo de leitura em minutos' })
        @IsNumber()
        @IsOptional()
        readingTime?: number;

        @ApiPropertyOptional({ description: 'Status do post' })
        @IsString()
        @IsOptional()
        status?: string;

        @ApiPropertyOptional({ description: 'Tags do post' })
        @IsArray()
        @IsString({ each: true })
        @IsOptional()
        tags?: string[];

        @ApiPropertyOptional({ description: 'Visualizações do post' })
        @IsNumber()
        @IsOptional()
        views?: number;

        @ApiPropertyOptional({ description: 'URL canônica para SEO' })
        @IsUrl()
        @IsOptional()
        canonical?: string;

        @ApiPropertyOptional({ description: 'Descrição para SEO' })
        @IsString()
        @IsOptional()
        description?: string;

        @ApiPropertyOptional({ description: 'Palavras-chave para SEO' })
        @IsArray()
        @IsString({ each: true })
        @IsOptional()
        keywords?: string[];
    }

    /**
     * DTO para atualização de um post existente.
     */
    export class UpdatePostDto extends CreatePostDto {
        @ApiProperty({ description: 'ID do post' })
        @IsUUID()
        @IsNotEmpty()
        postId: string;
    }

    /**
     * DTO para detalhes de um post.
     */
    export class PostDetailDto {
        @IsUUID()
        postId: string;

        @IsUUID()
        categoryId: string;

        @IsUUID()
        subcategoryId: string;

        @IsString()
        title: string;

        @IsString()
        contentHTML: string;

        @IsUUID()
        authorId: string;

        @IsString()
        slug: string;

        @IsUrl()
        @IsOptional()
        featuredImageURL?: string;

        @IsString()
        description: string;

        @IsISO8601()
        publishDate: string;

        @IsNumber()
        readingTime: number;

        @IsNumber()
        views: number;

        @IsString()
        status: string;

        @IsArray()
        @IsString({ each: true })
        tags: string[];

        @IsArray()
        @IsString({ each: true })
        keywords: string[];

        @IsUrl()
        @IsOptional()
        canonical?: string;
    }

    /**
     * DTO para resumo do blog.
     */
    export class BlogSummaryDto {
        metadata: {
            totalPosts: number;
            lastUpdated: string;
        };
        featuredPosts: PostSummaryDto[];
        recentPosts: PostSummaryDto[];
        categories: CategoryStatsDto[];
    }

    /**
     * DTO para conteúdo de um post.
     */
    export class PostContentDto extends PostDetailDto {
        relatedPosts: PostSummaryDto[];
        metadata: {
            seo: SeoMetadataDto;
            readingTime: number;
        };
    }

    /**
     * DTO para resposta de operações com posts.
     */
    export class PostOperationResponseDto {
        success: boolean;
        data?: PostDetailDto;
        error?: string;
    }

    /**
     * DTO para resumo de um post.
     */
    export class PostSummaryDto {
        @IsUUID()
        postId: string;

        @IsString()
        title: string;

        @IsUrl()
        featuredImage?: string;

        @IsISO8601()
        publishDate: string;

        @IsNumber()
        readingTime: number;
    }

    /**
     * DTO para estatísticas de categorias.
     */
    export class CategoryStatsDto {
        @IsUUID()
        id: string;

        @IsString()
        name: string;

        @IsNumber()
        postCount: number;

        @IsOptional()
        latestPost?: PostSummaryDto;
    }

    /**
     * DTO para metadados de SEO.
     */
    export class SeoMetadataDto {
        @IsString()
        title: string;

        @IsString()
        description: string;

        @IsString()
        keywords: string;

        @IsUrl()
        @IsOptional()
        canonical?: string;

        og?: {
            type: string;
            image?: string;
            publishedTime?: string;
        };

        structuredData?: any;
    }