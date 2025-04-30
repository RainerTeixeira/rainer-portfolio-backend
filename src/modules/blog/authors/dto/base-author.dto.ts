import { IsString, IsEmail, IsOptional } from 'class-validator';
import { IsSocialProof } from './social-proof-validator.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO base com campos comuns para criação e atualização
 */
export class BaseAuthorDto {
    @ApiPropertyOptional({ description: 'ID único do autor' })
    @IsString()
    @IsOptional()
    id?: string;

    @ApiProperty({ description: 'Nome completo do autor' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'E-mail do autor' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'Slug para URLs amigáveis' })
    @IsString()
    slug: string;

    @ApiProperty({ description: 'Biografia do autor' })
    @IsString()
    bio: string;

    @ApiProperty({ description: 'URL da foto de perfil' })
    @IsString()
    profile_picture_url: string;

    @ApiProperty({ description: 'Meta descrição para SEO' })
    @IsString()
    meta_description: string;

    @ApiProperty({
        description: 'Links sociais no formato { rede: { S: "url" } }',
        type: 'object',
        additionalProperties: { type: 'object', properties: { S: { type: 'string' } } }
    })
    @IsSocialProof()
    social_links: Record<string, { S: string }>;

    @ApiPropertyOptional({ description: 'Data de criação do registro' })
    @IsString()
    @IsOptional()
    created_at?: string;

    @ApiPropertyOptional({ description: 'Data da última atualização' })
    @IsString()
    @IsOptional()
    updated_at?: string;
}