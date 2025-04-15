import { IsString, IsEmail, IsOptional } from 'class-validator';
import { IsSocialProof } from './social-proof-validator.dto';

/**
 * DTO base com campos comuns para criação e atualização
 */
export class BaseAuthorDto {
    @IsString()
    @IsOptional()
    id?: string;

    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    slug: string;

    @IsString()
    bio: string;

    @IsString()
    profile_picture_url: string;

    @IsString()
    meta_description: string;

    @IsSocialProof()
    social_links: Record<string, { S: string }>;

    @IsString()
    @IsOptional()
    created_at?: string;

    @IsString()
    @IsOptional()
    updated_at?: string;
}