// src/modules/blog/authors/dto/update-author.dto.ts
import { IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AuthorSocialProofDto } from './author-social-proof.dto';

export class UpdateAuthorDto {
    @IsOptional()
    @IsString()
    postId?: string; // Opcional para update

    @IsOptional()
    @IsString()
    authorId?: string; // Opcional para update

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    expertise?: string[];

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => AuthorSocialProofDto)
    socialProof?: AuthorSocialProofDto;
}