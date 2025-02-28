// src/modules/blog/authors/dto/update-author.dto.ts
import { IsString, IsOptional } from 'class-validator';
import { IsSocialProof } from './Social-proof-validator.dto';

export class UpdateAuthorDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsSocialProof({ message: 'socialProof deve ser um objeto com chaves e valores do tipo string.' })
    socialProof?: Record<string, string>;
}
