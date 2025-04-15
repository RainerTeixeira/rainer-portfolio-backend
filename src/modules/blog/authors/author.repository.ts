import { Injectable } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { AuthorEntity } from '../entities/author.entity';
import { AttributeValue } from '@aws-sdk/client-dynamodb';

@Injectable()
export class AuthorRepository {
  private readonly tableName = 'Authors';

  constructor(private readonly dynamoDb: DynamoDbService) { }

  /**
   * Cria um novo autor com verificação de existência
   */
  async create(author: AuthorEntity): Promise<AuthorEntity> {
    await this.dynamoDb.put({
      TableName: this.tableName,
      Item: author.toDynamoItem(),
      ConditionExpression: 'attribute_not_exists(pk)'
    });
    return author;
  }

  /**
   * Busca autor por slug usando GSI
   */
  async findBySlug(slug: string): Promise<AuthorEntity | null> {
    const result = await this.dynamoDb.query({
      TableName: this.tableName,
      IndexName: 'GSI_Slug',
      KeyConditionExpression: '#slug = :slug AND #type = :type',
      ExpressionAttributeNames: { '#slug': 'slug', '#type': 'type' },
      ExpressionAttributeValues: {
        ':slug': { S: slug },
        ':type': { S: 'AUTHOR' }
      }
    });

    return result.Items?.length ? this.mapDynamoItem(result.Items[0]) : null;
  }

  /**
   * Atualização genérica com suporte a campos dinâmicos
   */
  async update(id: string, updates: Partial<AuthorEntity>): Promise<AuthorEntity> {
    const updateParams = this.buildUpdateParams(id, updates);

    const result = await this.dynamoDb.update(updateParams);
    return this.mapDynamoItem(result.Attributes);
  }

  private buildUpdateParams(id: string, updates: Partial<AuthorEntity>) {
    const updateExpressions = [];
    const expressionAttributes: Record<string, AttributeValue> = {};
    const expressionNames: Record<string, string> = {};

    Object.entries(updates).forEach(([key, value], index) => {
      updateExpressions.push(`#field${index} = :value${index}`);
      expressionNames[`#field${index}`] = key;
      expressionAttributes[`:value${index}`] = { S: value.toString() };
    });

    return {
      TableName: this.tableName,
      Key: { pk: { S: `AUTHOR#${id}` }, sk: { S: 'PROFILE' } },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionAttributes,
      ReturnValues: 'ALL_NEW'
    };
  }

  private mapDynamoItem(item: Record<string, AttributeValue>): AuthorEntity {
    return new AuthorEntity({
      id: item.id.S,
      name: item.name.S,
      email: item.email.S,
      slug: item.slug.S,
      bio: item.bio.S,
      profile_picture_url: item.profile_picture_url.S,
      meta_description: item.meta_description.S,
      social_links: this.parseSocialLinks(item.social_links.M),
      created_at: item.created_at.S,
      updated_at: item.updated_at.S
    });
  }

  private parseSocialLinks(links: Record<string, AttributeValue>): Record<string, string> {
    return Object.entries(links).reduce((acc, [key, value]) => {
      acc[key] = value.S;
      return acc;
    }, {});
  }
}