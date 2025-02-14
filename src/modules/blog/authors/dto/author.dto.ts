// src/modules/blog/authors/dto/author.dto.ts

export class AuthorDto {
    postId: string; // Chave de Partição (postId) - String
    authorId: string; // Chave de Classificação (authorId) - String
    name: string;
    slug: string;
    expertise: string[]; // Lista de strings
    socialProof: {
        facebook?: string; // Map com campos opcionais
        github?: string;
        medium?: string;
    };
}