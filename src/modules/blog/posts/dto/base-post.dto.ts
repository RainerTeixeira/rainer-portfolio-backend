// src/posts/dto/base-post.dto.ts
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsUrl,
    IsDateString,
    IsEnum,
    IsArray,
    ArrayNotEmpty,
    IsNumber,
    IsPositive,
    MinLength,
    MaxLength,
} from 'class-validator';

// --- Enum Definido Diretamente no Arquivo ---
export enum PostStatus {
    PUBLISHED = 'published',
    DRAFT = 'draft',
    ARCHIVED = 'archived',
}
// ------------------------------------------

/**
 * DTO base representando a estrutura completa de um item Post no DynamoDB.
 * Inclui todos os campos, com validações apropriadas.
 * Campos gerenciados pelo sistema ou não sempre presentes são opcionais.
 */
export class BasePostDto {
    /**
     * Identificador único do post (Chave de Partição).
     * Formato: POST#<id>
     * Geralmente gerenciado pelo sistema, opcional na entrada de dados.
     * @example "POST#p9f8e7d6"
     */
    @IsOptional() // ID é gerado, não fornecido pelo cliente geralmente
    @IsString()
    @IsNotEmpty()
    id: string; // Renomeado de "POST#id" para clareza no código

    // METADATA é uma chave de classificação interna, não costuma ir no DTO de aplicação.
    // Se precisar, adicione:
    // @IsOptional() @IsString() @IsNotEmpty() metadata?: string;

    /**
     * Título principal do post.
     * @example "Otimizando Aplicações React com Code Splitting"
     */
    @IsString()
    @IsNotEmpty()
    @MinLength(5)
    @MaxLength(200)
    title: string;

    /**
     * URL amigável (slug) para o post. Usado no GSI_Slug.
     * @example "otimizando-react-code-splitting"
     */
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    // @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    slug: string;

    /**
     * Resumo ou introdução curta do post.
     * @example "Aprenda como usar code splitting no React..."
     */
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    excerpt: string;

    /**
     * Conteúdo completo do post (HTML/Markdown).
     * @example "<article><h2>Guia...</h2>...</article>"
     */
    @IsString()
    @IsNotEmpty()
    content: string;

    /**
     * Status atual do post (publicado, rascunho, arquivado).
     * @example "published"
     */
    @IsEnum(PostStatus)
    status: PostStatus;

    /**
     * ID do autor do post (usado no GSI_AuthorPosts).
     * @example "a1b2c3d4"
     */
    @IsString()
    @IsNotEmpty()
    authorId: string;

    /**
     * ID da categoria principal (usado no GSI_CategoryPosts).
     * @example "yjb9rz-290"
     */
    @IsString()
    @IsNotEmpty()
    categoryId: string;

    /**
     * ID da subcategoria (opcional).
     * @example "atb9az-160"
     */
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    subcategoryId?: string; // Mantido nome simples 'subcategoryId'

    /**
     * Lista de tags ou palavras-chave associadas ao post.
     * @example ["react", "performance", "code splitting"]
     */
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    tags: string[];

    /**
     * Data e hora em que o post foi (ou será) publicado (usado em GSIs). Formato ISO 8601.
     * Tornando opcional aqui para permitir flexibilidade nos DTOs derivados.
     * @example "2024-04-10T09:00:00Z"
     */
    @IsOptional() // Tornando opcional na base para Create/Update funcionarem como pedido
    @IsDateString()
    publishDate?: string;

    /**
     * Data e hora da criação do registro do post no banco. Formato ISO 8601.
     * Gerenciado pelo sistema.
     * @example "2024-04-08T11:00:00Z"
     */
    @IsOptional() // Gerado pelo sistema
    @IsDateString()
    readonly createdAt?: string;

    /**
     * Data e hora da última atualização do post. Formato ISO 8601.
     * Gerenciado pelo sistema ou explicitamente definido na atualização (conforme solicitado).
     * @example "2024-04-12T18:00:00Z"
     */
    @IsOptional() // Gerado/definido na atualização
    @IsDateString()
    lastUpdatedDate?: string;

    /**
     * Número de visualizações do post (usado no GSI_CategoryPosts).
     * Gerenciado pelo sistema.
     * @example 1589
     */
    @IsOptional() // Gerado pelo sistema
    @IsNumber()
    @IsPositive()
    views?: number;

    /**
     * Número de curtidas (likes) do post.
     * Gerenciado pelo sistema.
     * @example 75
     */
    @IsOptional() // Gerado pelo sistema
    @IsNumber()
    @IsPositive()
    likes?: number;

    /**
     * Número de comentários aprovados no post.
     * Gerenciado pelo sistema.
     * @example 12
     */
    @IsOptional() // Gerado pelo sistema
    @IsNumber()
    @IsPositive()
    commentCount?: number;

    /**
     * URL da imagem de destaque ou capa do post.
     * @example "https://www.seusite.com/posts/otimizando-react-code-splitting"
     * Nota: O exemplo parece uma URL de post, não de imagem. Validando como URL genérica.
     */
    @IsOptional()
    @IsUrl()
    postPictureUrl?: string;

    /**
     * Descrição curta para meta tags HTML (SEO).
     * @example "Guia completo sobre code splitting em React..."
     */
    @IsOptional()
    @IsString()
    @MaxLength(160)
    metaDescription?: string;

    /**
     * Título para Open Graph (compartilhamento em redes sociais).
     * @example "Otimizando Aplicações React com Code Splitting | Seu Site"
     */
    @IsOptional()
    @IsString()
    @MaxLength(95)
    ogTitle?: string;

    /**
     * Descrição para Open Graph.
     * @example "Aprenda como usar code splitting no React..."
     */
    @IsOptional()
    @IsString()
    @MaxLength(200)
    ogDescription?: string;

    /**
     * URL da imagem para Open Graph.
     * @example "https://cdn.example.com/images/posts/react-code-splitting-og.jpg"
     */
    @IsOptional()
    @IsUrl()
    ogImage?: string;

    // O campo 'type' com valor "POST" é metadado interno do DynamoDB para identificar o tipo de item,
    // geralmente não necessário no DTO da aplicação, a menos que haja polimorfismo na API.
    // Se precisar:
    // @IsOptional() @IsString() readonly type?: string = 'POST';
}