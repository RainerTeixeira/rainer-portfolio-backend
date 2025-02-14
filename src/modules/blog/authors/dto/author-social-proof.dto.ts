// src/modules/blog/authors/dto/author-social-proof.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class AuthorSocialProofDto {
    @IsOptional()
    @IsString()
    Facebook?: string;

    @IsOptional()
    @IsString()
    github?: string;

    @IsOptional()
    @IsString()
    medium?: string;
}