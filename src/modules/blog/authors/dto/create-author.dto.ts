import { IsString, IsOptional } from 'class-validator';
import { IsSocialProof } from './Social-proof-validator.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuthorDto {
    @ApiProperty({ description: 'ID do autor', example: { S: '1' } })
    @IsString()
    authorId: string;

    @ApiProperty({ description: 'Nome do autor', example: { S: 'John Doe' } })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Slug do autor (parte da URL)', example: { S: 'john-doe' } })
    @IsString()
    slug: string;

    @ApiPropertyOptional({
        description: 'Provas sociais do autor, como redes sociais ou referências',
        type: 'object',
        example: {
            M: {
                github: { S: 'github.com/john-doe' },
                medium: { S: 'john-doe.medium.com' },
                socialProof: { S: 'facebook.com/john-doe' }
            }
        }
    })
    @IsOptional()
    @IsSocialProof({ message: 'socialProof deve ser um objeto contendo chaves e valores do tipo string.' })
    socialProof?: Record<string, string>;
}
