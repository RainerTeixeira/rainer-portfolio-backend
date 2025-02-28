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
