/**
 * @file author.repository.ts
 * @description
 * Repositório responsável por gerenciar as operações de acesso a dados da entidade Author no DynamoDB.
 * Fornece métodos para criar, buscar, atualizar, remover e listar autores, além de buscar por slug e listar autores recentes.
 * Utiliza índices secundários globais (GSI) para otimizar buscas por slug e autores recentes.
 * 
 * Principais métodos:
 * - create: Cria um novo autor.
 * - findById: Busca autor pelo ID.
 * - update: Atualiza dados de um autor existente.
 * - delete: Remove um autor.
 * - findBySlug: Busca autor pelo slug.
 * - listRecentAuthors: Lista autores mais recentes.
 * 
 * Observações:
 * - O mapeamento entre o formato do DynamoDB e a entidade AuthorEntity é realizado pelo método estático fromDynamo.
 * - O repositório utiliza o serviço DynamoDbService para abstrair operações de baixo nível com o banco.
 * - Exceções são lançadas para casos de não encontrados ou falhas em operações críticas.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { DynamoDbService } from '../../../services/dynamoDb.service';
import { AuthorEntity } from './authors.entity';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

/**
 * @repository AuthorRepository
 * @description Gerencia operações de acesso a dados para entidades Author no DynamoDB
 * @method create - Cria um novo autor
 * @method findById - Busca autor por ID
 * @method update - Atualiza autor existente
 * @method delete - Remove autor
 * @method findBySlug - Busca autor por slug usando GSI_Slug
 * @method listRecentAuthors - Lista autores recentes usando GSI_RecentAuthors
 */
@Injectable()
export class AuthorRepository {
    private readonly TABLE_NAME = 'Authors';
    private readonly INDEXES = {
        SLUG: 'GSI_Slug',
        RECENT_AUTHORS: 'GSI_RecentAuthors',
    };
    private readonly ATTRIBUTES = {
        SLUG: 'slug',
        TYPE: 'type',
        CREATED_AT: 'created_at',
    };

    constructor(private readonly dynamoDb: DynamoDbService) {}

    /**
     * @description Cria um novo autor na tabela Authors
     * @param createDto DTO com dados para criação do autor
     * @returns AuthorEntity criada
     */
    async create(createDto: CreateAuthorDto): Promise<AuthorEntity> {
        const author = new AuthorEntity(createDto);
        await this.dynamoDb.put({
            TableName: this.TABLE_NAME,
            Item: author,
        });
        return author;
    }

    /**
     * @description Busca autor por chave primária (ID)
     * @param id ID do autor (ex: "yjb8rx-240")
     * @returns AuthorEntity encontrada ou null se não existir
     */
    async findById(id: string): Promise<AuthorEntity | null> {
        const result = await this.dynamoDb.get({
            TableName: this.TABLE_NAME,
            Key: {
                'AUTHOR#id': id, // id puro, ex: 'yjb8rx-240'
                'PROFILE': 'PROFILE',
            },
        });

        if (!result?.data?.Item) {
            return null;
        }

        return new AuthorEntity(AuthorRepository.fromDynamo(result.data.Item));
    }

    /**
     * @description Atualiza autor existente
     * @param id ID do autor
     * @param updateDto DTO com dados para atualização
     * @returns AuthorEntity atualizada
     */
    async update(id: string, updateDto: UpdateAuthorDto): Promise<AuthorEntity> {
        // Busca o autor existente para garantir que ele existe
        await this.findById(id);

        const result = await this.dynamoDb.update({
            TableName: this.TABLE_NAME,
            Key: {
                'AUTHOR#id': `AUTHOR#${id}`,
                'PROFILE': 'PROFILE',
            },
            UpdateExpression: 'SET #name = :name, email = :email, slug = :slug, bio = :bio, '
                + 'profile_picture_url = :profilePicture, meta_description = :metaDescription, '
                + 'social_links = :socialLinks, updated_at = :updatedAt',
            ExpressionAttributeNames: { '#name': 'name' },
            ExpressionAttributeValues: {
                ':name': updateDto.name,
                ':email': updateDto.email,
                ':slug': updateDto.slug,
                ':bio': updateDto.bio,
                ':profilePicture': updateDto.profile_picture_url,
                ':metaDescription': updateDto.meta_description,
                ':socialLinks': updateDto.social_links,
                ':updatedAt': new Date().toISOString(),
            },
            ReturnValues: 'ALL_NEW',
        });

        if (!result?.data?.Attributes) {
            throw new NotFoundException(`Author with id ${id} not found for update`);
        }

        return new AuthorEntity(AuthorRepository.fromDynamo(result.data.Attributes));
    }

    /**
     * @description Remove autor da base de dados
     * @param id ID do autor a ser removido
     */
    async delete(id: string): Promise<void> {
        // Garante que o autor existe antes de deletar
        await this.findById(id);

        await this.dynamoDb.delete({
            TableName: this.TABLE_NAME,
            Key: {
                'AUTHOR#id': id, // id puro, igual ao findById
                'PROFILE': 'PROFILE',
            },
        });
    }

    /**
     * @description Busca autor por slug usando índice GSI_Slug
     * @param slug Slug único do autor
     * @throws NotFoundException se nenhum autor for encontrado
     * @returns AuthorEntity encontrada
     */
    async findBySlug(slug: string): Promise<AuthorEntity> {
        const result = await this.dynamoDb.query({
            TableName: this.TABLE_NAME,
            IndexName: this.INDEXES.SLUG,
            KeyConditionExpression: '#slug = :slug AND #type = :type',
            ExpressionAttributeNames: {
                '#slug': this.ATTRIBUTES.SLUG,
                '#type': this.ATTRIBUTES.TYPE,
            },
            ExpressionAttributeValues: {
                ':slug': slug,
                ':type': 'AUTHOR',
            },
        });

        const items = this.mapItemsToEntities(result);
        if (items.length === 0) {
            throw new NotFoundException(`Author with slug ${slug} not found`);
        }
        return items[0];
    }

    /**
     * @description Lista autores mais recentes usando índice GSI_RecentAuthors
     * @param limit Limite de autores a retornar (default: 10)
     * @returns Lista de AuthorEntity ordenadas por data de criação
     */
    async listRecentAuthors(limit: number = 10): Promise<AuthorEntity[]> {
        const result = await this.dynamoDb.query({
            TableName: this.TABLE_NAME,
            IndexName: this.INDEXES.RECENT_AUTHORS,
            KeyConditionExpression: '#type = :type',
            ExpressionAttributeNames: {
                '#type': this.ATTRIBUTES.TYPE,
            },
            ExpressionAttributeValues: {
                ':type': 'AUTHOR',
            },
            Limit: limit,
            ScanIndexForward: false, // Mais recentes primeiro
        });

        return this.mapItemsToEntities(result);
    }

    /**
     * @description Mapeia resultados do DynamoDB para entidades Author
     * @param result Resultado da consulta DynamoDB
     * @returns Array de AuthorEntity
     */
    private mapItemsToEntities(result: { data?: { Items?: Record<string, unknown>[] } }): AuthorEntity[] {
        return result.data?.Items?.map((item: Record<string, unknown>) =>
            new AuthorEntity(AuthorRepository.fromDynamo(item))
        ) || [];
    }

    /**
     * Converte um item do formato AttributeValue do DynamoDB para objeto plano.
     * Compatível com registros aninhados em "AUTHOR#id".
     */
    private static fromDynamo(item: Record<string, unknown>): Record<string, unknown> | null {
        if (!item) return null;

        // Se o item está aninhado dentro de "AUTHOR#id", descompacta todos os campos
        if (item['AUTHOR#id'] && typeof item['AUTHOR#id'] === 'object' && (item['AUTHOR#id'] as any).S === undefined) {
            const inner = item['AUTHOR#id'] as Record<string, unknown>;
            for (const key of Object.keys(inner)) {
                item[key] = inner[key];
            }
            if (inner['S']) {
                item['AUTHOR#id'] = inner['S'];
            }
        } else if (item['AUTHOR#id'] && typeof item['AUTHOR#id'] === 'object' && (item['AUTHOR#id'] as any).S) {
            item['AUTHOR#id'] = (item['AUTHOR#id'] as any).S;
        }

        const obj: Record<string, unknown> = {};
        for (const key of Object.keys(item)) {
            const value = item[key];
            if (key === 'AUTHOR#id' && typeof value === 'object' && value && 'S' in value) {
                obj[key] = (value as any).S;
            } else if (value && typeof value === 'object' && 'S' in value) obj[key] = (value as any).S;
            else if (value && typeof value === 'object' && 'N' in value) obj[key] = Number((value as any).N);
            else if (value && typeof value === 'object' && 'BOOL' in value) obj[key] = (value as any).BOOL;
            else if (value && typeof value === 'object' && 'M' in value) obj[key] = AuthorRepository.fromDynamo((value as any).M);
            else if (value && typeof value === 'object' && 'L' in value) obj[key] = (value as any).L.map(AuthorRepository.fromDynamo);
            else if (value && typeof value === 'object' && 'SS' in value) obj[key] = (value as any).SS;
            else if (value && typeof value === 'object' && 'NS' in value) obj[key] = (value as any).NS.map(Number);
            else obj[key] = value;
        }
        return obj;
    }
}
