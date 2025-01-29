// src/controller/authors/dto/update-author.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class UpdateAuthorDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsString()
    website?: string;
}
