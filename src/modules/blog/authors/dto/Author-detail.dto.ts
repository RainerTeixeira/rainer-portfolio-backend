// src/modules/blog/authors/dto/author-detail.dto.ts

import { IsString, IsOptional } from 'class-validator';
// Presumo que você tenha seu validador customizado no caminho correto
// Se o nome do arquivo for diferente, ajuste o import.
import { IsSocialProof } from './social-proof-validator.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Logger } from '@nestjs/common'; // Para logs opcionais

// Interface para clareza, documenta a forma esperada do item vindo do DynamoDB
// (DocumentClient retorna um objeto JS, mas a interface ajuda a entender)
interface DynamoDBAuthorItem {
    authorId?: any; // Permite tipos diferentes antes da validação
    name?: any;
    slug?: any;
    socialProof?: any;
}

/**
 * @class AuthorDetailDto
 * @description Data Transfer Object para detalhar informações de um autor.
 * Usado para retornar dados de autores e potencialmente validar dados de saída.
 */
export class AuthorDetailDto {
    // Logger estático opcional para uso dentro de métodos estáticos como fromDynamoDB
    private static readonly logger = new Logger(AuthorDetailDto.name);

    @ApiProperty({ description: 'ID único do autor', example: 'uuid-exemplo-1234' })
    @IsString({ message: 'O authorId deve ser uma string.' })
    authorId: string;

    @ApiProperty({ description: 'Nome completo do autor', example: 'João da Silva' })
    @IsString({ message: 'O nome (name) deve ser uma string.' })
    name: string;

    @ApiProperty({
        description: 'Identificador único amigável para URLs (slug)',
        example: 'joao-da-silva'
    })
    @IsString({ message: 'O slug deve ser uma string.' })
    slug: string;

    @ApiPropertyOptional({
        description: 'Links de perfis sociais ou outras provas sociais do autor.',
        type: 'object',
        additionalProperties: { type: 'string' }, // Ajuda Swagger a entender Record<string, string>
        example: {
            github: 'https://github.com/joao-da-silva',
            linkedin: 'https://linkedin.com/in/joao-da-silva',
            portfolio: 'https://joaodasilva.dev'
        }
    })
    @IsOptional()
    @IsSocialProof({ message: 'socialProof deve ser um objeto onde todas as chaves e valores são strings.' })
    socialProof?: Record<string, string>;

    /**
     * @description Método estático para converter um item retornado pelo DynamoDB (via DocumentClient, já como objeto JS)
     * para uma instância de AuthorDetailDto. Realiza checagens básicas de tipo e existência de ID.
     * @param item - O objeto retornado pelo DynamoDB (esperado ter as propriedades do autor).
     * @returns {AuthorDetailDto | null} Uma instância de AuthorDetailDto se a conversão for bem-sucedida e o item for válido, ou null caso contrário.
     */
    static fromDynamoDB(item: Record<string, any>): AuthorDetailDto | null {
        // 1. Validação básica do input: Verifica se é um objeto não nulo.
        if (!item || typeof item !== 'object') {
            this.logger.warn(`Tentativa de converter item inválido (não-objeto ou nulo) do DynamoDB para AuthorDetailDto: ${JSON.stringify(item)}`);
            return null; // Retorna null se o item de entrada não for um objeto válido
        }

        // 2. Instanciação: Cria uma nova instância da classe AuthorDetailDto.
        const dto = new AuthorDetailDto();

        // 3. Mapeamento e Tipagem: Atribui valores do item à instância,
        //    verificando tipos e usando fallbacks seguros.
        dto.authorId = typeof item.authorId === 'string' ? item.authorId.trim() : ""; // Remove espaços extras
        dto.name = typeof item.name === 'string' ? item.name.trim() : "";
        dto.slug = typeof item.slug === 'string' ? item.slug.trim() : "";

        // Para socialProof, verifica se é um objeto e não nulo.
        // Assume que o DocumentClient já retorna um objeto JS mapeado corretamente.
        // Se precisar de validação mais profunda dos valores internos, pode ser adicionada aqui.
        dto.socialProof = typeof item.socialProof === 'object' && item.socialProof !== null
            ? item.socialProof
            : {}; // Fallback para objeto vazio

        // 4. Validação Essencial: Garante que um ID (authorId) foi atribuído.
        //    Um autor sem ID geralmente não é útil.
        if (!dto.authorId) {
            this.logger.error(`Item do DynamoDB convertido resultou em AuthorDetailDto sem authorId. Item original: ${JSON.stringify(item)}`);
            // Retornar null é geralmente mais seguro do que lançar um erro aqui,
            // permitindo que a camada de serviço decida como lidar com dados incompletos.
            return null;
        }

        // 5. Retorno: Retorna a instância do DTO preenchida e validada minimamente.
        return dto;
    }
}

export { AuthorDetailDto as AuthorDto };