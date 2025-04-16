import { Injectable } from '@nestjs/common';
import { AuthorEntity } from './authors.entity';
import { DynamoDbService } from '../../../services/dynamoDb.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

/**
 * @AuthorRepository
 *
 * Repositório responsável pelas operações de acesso a dados para a entidade Author.
 * Usa o DynamoDbService como camada de acesso ao banco de dados.
 */
@Injectable()
export class AuthorRepository {
  private readonly tableName = 'Authors';

  constructor(private readonly dynamoDb: DynamoDbService) { }

  async create(createAuthorDto: CreateAuthorDto): Promise<AuthorEntity> {
    const author = new AuthorEntity(createAuthorDto);
    await this.dynamoDb.put({
      TableName: this.tableName,
      Item: author,
    });
    return author;
  }

  async update(id: string, updateAuthorDto: UpdateAuthorDto): Promise<AuthorEntity> {
    const result = await this.dynamoDb.update({
      TableName: this.tableName,
      Key: {
        'AUTHOR#id': `AUTHOR#${id}`,
        PROFILE: 'PROFILE',
      },
      UpdateExpression: 'SET #name = :name, email = :email, slug = :slug, bio = :bio, '
        + 'profile_picture_url = :profilePicture, meta_description = :metaDescription, '
        + 'social_links = :socialLinks, updated_at = :updatedAt',
      ExpressionAttributeNames: { '#name': 'name' },
      ExpressionAttributeValues: {
        ':name': updateAuthorDto.name,
        ':email': updateAuthorDto.email,
        ':slug': updateAuthorDto.slug,
        ':bio': updateAuthorDto.bio,
        ':profilePicture': updateAuthorDto.profile_picture_url,
        ':metaDescription': updateAuthorDto.meta_description,
        ':socialLinks': updateAuthorDto.social_links,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    });

    // ✅ Verifica se há dados antes de criar a entidade
    if (!result.data.Attributes) {
      throw new Error('Erro ao atualizar autor: dados não retornados do banco.');
    }

    return new AuthorEntity(result.data.Attributes);
  }

  async delete(id: string): Promise<void> {
    await this.dynamoDb.delete({
      TableName: this.tableName,
      Key: {
        'AUTHOR#id': `AUTHOR#${id}`,
        PROFILE: 'PROFILE',
      },
    });
  }

  /**
   * Retorna AuthorEntity ou null se não encontrado.
   */
  async findById(id: string): Promise<AuthorEntity | null> {
    const result = await this.dynamoDb.get({
      TableName: this.tableName,
      Key: {
        'AUTHOR#id': `AUTHOR#${id}`,
        PROFILE: 'PROFILE',
      },
    });

    return result.data.Item ? new AuthorEntity(result.data.Item) : null;
  }

  /**
   * Retorna AuthorEntity ou null se não encontrado via scan por slug.
   */
  async findBySlug(slug: string): Promise<AuthorEntity | null> {
    const result = await this.dynamoDb.scan({
      TableName: this.tableName,
      FilterExpression: 'slug = :slug',
      ExpressionAttributeValues: { ':slug': slug },
    });

    return result.data.Items?.[0] ? new AuthorEntity(result.data.Items[0]) : null;
  }

  /**
   * Lista os autores mais recentes usando índice GSI_RecentAuthors.
   */
  async listRecentAuthors(limit: number = 10): Promise<AuthorEntity[]> {
    const result = await this.dynamoDb.query({
      TableName: this.tableName,
      IndexName: 'GSI_RecentAuthors',
      KeyConditionExpression: '#type = :type',
      ExpressionAttributeNames: { '#type': 'type' },
      ExpressionAttributeValues: { ':type': 'AUTHOR' },
      Limit: limit,
      ScanIndexForward: false,
    });

    return result.data.Items?.map(item => new AuthorEntity(item)) || [];
  }
}
