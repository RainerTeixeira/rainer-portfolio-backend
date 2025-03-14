import { IsString, IsOptional } from 'class-validator';
import { IsSocialProof } from './social-proof-validator.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthorDetailDto {
    @ApiProperty({ description: 'ID do autor', example: '1' })
    @IsString()
    authorId: string;

    @ApiProperty({ description: 'Nome do autor', example: 'John Doe' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Slug do autor (parte da URL)', example: 'john-doe' })
    @IsString()
    slug: string;

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

    /**
     * Método estático para converter um item do DynamoDB para AuthorDetailDto
     */
    static fromDynamoDB(item: any): AuthorDetailDto {
        return {
            authorId: item.authorId || "", // Não é necessário acessar com `.S` já que o dado é direto
            name: item.name || "",
            slug: item.slug || "",
            socialProof: item.socialProof || {}, // Se não houver socialProof, retorna um objeto vazio
        };
    }
}
