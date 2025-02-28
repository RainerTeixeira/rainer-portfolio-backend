// src/modules/blog/authors/dto/create-author.dto.ts
import { IsString, IsOptional } from 'class-validator';
import { IsSocialProof } from './Social-proof-validator.dto';

export class CreateAuthorDto {
    @IsString()
    name: string;

    @IsString()
    slug: string;

    @IsOptional()
    @IsSocialProof({ message: 'socialProof deve ser um objeto com chaves e valores do tipo string.' })
    socialProof?: Record<string, string>;
}
