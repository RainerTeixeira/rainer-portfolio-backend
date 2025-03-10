import { IsString, IsUrl, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PostSummaryDto {
    @ApiProperty({ description: 'Título do post', example: 'Guia Definitivo: Construindo APIs Escaláveis com NestJS' })
    @IsString()
    title: string;

    @ApiProperty({ description: 'URL da imagem destacada', example: 'url-imagem-destaque-nestjs.jpg' })
    @IsUrl()
    featuredImageURL: string;

    @ApiProperty({ description: 'Descrição breve do post', example: 'Descubra como utilizar NestJS para desenvolver APIs escaláveis...' })
    @IsString()
    description: string;

    // SEO Metadata
    @ApiProperty({ description: 'URL canônica do post', example: 'https://meusite.com/blog/guia-definitivo-apis-nestjs' })
    @IsUrl()
    canonical: string;

    @ApiProperty({ description: 'Palavras-chave para SEO', example: ['API escalável', 'Backend seguro', 'NestJS', 'TypeScript'] })
    @IsArray()
    @IsString({ each: true })
    keywords: string[];

    @ApiProperty({ description: 'Tags associadas ao post', example: ['APIs', 'Backend', 'NestJS', 'TypeScript'] })
    @IsArray()
    @IsString({ each: true })
    tags: string[];
}
