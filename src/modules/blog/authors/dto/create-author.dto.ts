// src/modules/blog/authors/dto/create-author.dto.ts

import { IsNotEmpty, IsString, IsArray, IsOptional, IsObject } from 'class-validator';

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

    @IsOptional()
    @IsArray()
    expertise?: string[];

    @IsOptional()
    @IsObject()
    socialProof?: { [key: string]: string };

    constructor(postId: string, authorId: string, name: string, slug: string, expertise?: string[], socialProof?: { [key: string]: string }) {
        this.postId = postId;
        this.authorId = authorId;
        this.name = name;
        this.slug = slug;
        this.expertise = expertise;
        this.socialProof = socialProof;
    }
}