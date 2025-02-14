// src/modules/blog/authors/dto/update-author.dto.ts

import { AuthorDto } from '@src/modules/blog/authors/dto/author.dto'; // Import AuthorDto usando alias @src.
import { IsOptional, IsString, IsArray, IsObject } from 'class-validator'; // Import decorators de validação (mantenha este import - é um pacote externo)

export class UpdateAuthorDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsArray()
    expertise?: string[];

    @IsOptional()
    @IsObject()
    socialProof?: {
        facebook?: string;
        github?: string;
        medium?: string;
    };
}