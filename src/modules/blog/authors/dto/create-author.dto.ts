import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
import { IsSocialProof } from './social-proof-validator.dto';
import { BaseAuthorDto } from './base-author.dto';

export class CreateAuthorDto extends BaseAuthorDto {
    @IsString()
    @IsNotEmpty()
    authorId: string;

    @IsString()
    @IsNotEmpty()
    profile: string;

    @IsString()
    bio: string;

    @IsString()
    created_at: string;

    @IsEmail()
    email: string;

    @IsString()
    meta_description: string;

    @IsString()
    name: string;

    @IsString()
    profile_picture_url: string;

    @IsString()
    slug: string;

    @IsSocialProof({ message: 'social_links deve ser um objeto no formato { chave: { S: "valor" } }' })
    social_links: Record<string, { S: string }>;

    @IsString()
    type: string;

    @IsString()
    updated_at: string;
}
