// src/modules/blog/authors/dto/author.dto.ts
import { AuthorSocialProofDto } from './author-social-proof.dto';

export class AuthorDto {
    postId: string; // Chave de Partição
    authorId: string; // Chave de Classificação
    expertise: string[]; // Lista de Strings
    name: string;
    slug: string;
    socialProof?: AuthorSocialProofDto; // Objeto aninhado, opcional

    constructor(
        postId: string,
        authorId: string,
        expertise: string[],
        name: string,
        slug: string,
        socialProof?: AuthorSocialProofDto,
    ) {
        this.postId = postId;
        this.authorId = authorId;
        this.expertise = expertise;
        this.name = name;
        this.slug = slug;
        this.socialProof = socialProof;
    }
}