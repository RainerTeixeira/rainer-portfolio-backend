// src/modules/blog/authors/dto/update-author.dto.ts

import { AuthorDto } from './author.dto';
import { IsOptional, IsString, IsArray, IsObject } from 'class-validator'; // Import decorators de validação (opcional)

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