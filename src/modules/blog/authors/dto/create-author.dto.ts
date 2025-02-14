// src/modules/blog/authors/dto/create-author.dto.ts

import { AuthorDto } from './author.dto';
import { IsNotEmpty, IsString, IsArray, IsOptional, IsObject } from 'class-validator'; // Import decorators de validação (opcional, mas recomendado)

export class CreateAuthorDto {
    @IsNotEmpty()
    @IsString()
    postId: string;

    @IsNotEmpty()
    @IsString()
    authorId: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    slug: string;

    @IsArray() // Validação que expertise é um array (opcional, dependendo da sua necessidade)
    expertise?: string[];

    @IsObject() // Validação que socialProof é um objeto (opcional)
    @IsOptional()
    socialProof?: {
        facebook?: string;
        github?: string;
        medium?: string;
    };
}