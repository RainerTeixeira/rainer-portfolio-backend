import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl } from 'class-validator';

export class SeoMetadataDto {
    @ApiProperty({
        description: 'Título para SEO',
        example: 'Título do Post - Meu Blog',
    })
    @IsString()
    title: string;

    @ApiProperty({
        description: 'Descrição para SEO',
        example: 'Descrição do post para motores de busca',
    })
    @IsString()
    description: string;

    @ApiProperty({
        description: 'Palavras-chave para SEO',
        example: 'tecnologia, programação, nestjs',
    })
    @IsString()
    keywords: string;

    @ApiPropertyOptional({
        description: 'URL canônica',
        example: 'https://meusite.com/blog/titulo-do-post',
    })
    @IsUrl()
    @IsOptional()
    canonical?: string;

    @ApiPropertyOptional({
        description: 'Metadados Open Graph',
        type: 'object',
        properties: {
            type: { type: 'string', example: 'article' },
            image: { type: 'string', example: 'https://example.com/image.jpg' },
            publishedTime: { type: 'string', example: '2024-01-01T12:00:00Z' },
        },
    })
    og?: {
        type: string;
        image?: string;
        publishedTime?: string;
    };

    @ApiPropertyOptional({
        description: 'Dados estruturados para SEO',
        type: 'object',
        example: {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: 'Título do Post',
            description: 'Descrição do post',
            datePublished: '2024-01-01T12:00:00Z',
            author: {
                '@type': 'Person',
                name: 'Autor do Post',
            },
        },
    })
    structuredData?: any;
}