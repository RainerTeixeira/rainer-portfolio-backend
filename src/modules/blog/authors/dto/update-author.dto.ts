// src/modules/blog/authors/dto/update-author.dto.ts
import { IsString, IsOptional } from 'class-validator';
import { IsSocialProof } from './Social-proof-validator.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAuthorDto {
    @ApiPropertyOptional({ description: 'Nome do autor', example: 'John Doe' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ description: 'Slug do autor (parte da URL)', example: 'john-doe' })
    @IsOptional()
    @IsString()
    slug?: string;

    @ApiPropertyOptional({
        description: 'Provas sociais do autor, como redes sociais ou referências',
        type: 'object',
        example: {
            github: 'github.com/john-doe',
            medium: 'john-doe.medium.com',
            socialProof: 'facebook.com/john-doe'
        }
    })
    @IsOptional()
    @IsSocialProof({ message: 'socialProof deve ser um objeto contendo chaves e valores do tipo string.' })
    socialProof?: Record<string, string>;
}
