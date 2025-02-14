// src/modules/blog/authors/dto/create-author.dto.ts
import { IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AuthorSocialProofDto } from './author-social-proof.dto';

export class CreateAuthorDto {
    @IsString()
    postId: string;

    @IsString()
    authorId: string;

    @IsArray()
    @IsString({ each: true })
    expertise: string[];

    @IsString()
    name: string;

    @IsString()
    slug: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => AuthorSocialProofDto)
    socialProof?: AuthorSocialProofDto;

    constructor(
        postId: string,
        authorId: string,
        expertise: string[],
        name: string,
        slug: string,
        socialProof?: AuthorSocialProofDto, // SocialProof é opcional
    ) {
        this.postId = postId;
        this.authorId = authorId;
        this.expertise = expertise;
        this.name = name;
        this.slug = slug;
        this.socialProof = socialProof;
    }
}