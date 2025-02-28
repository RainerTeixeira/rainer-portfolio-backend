// src/modules/blog/authors/dto/author-detail.dto.ts
import { IsString, IsOptional } from 'class-validator';
import { IsSocialProof } from './Social-proof-validator.dto';

export class AuthorDetailDto {
    @IsString()
    authorId: string;

    @IsString()
    name: string;

    @IsString()
    slug: string;

    @IsOptional()
    @IsSocialProof({ message: 'socialProof deve ser um objeto com chaves e valores do tipo string.' })
    socialProof?: Record<string, string>;
}
