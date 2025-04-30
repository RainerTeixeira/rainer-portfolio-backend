// comments.repository.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { CommentEntity } from './comments.entity'; // Nome do arquivo corrigido (plural)
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

/**
 * Repositório responsável por realizar operações de persistência e consulta de comentários no DynamoDB.
 * Implementa métodos para criar, buscar, atualizar, remover e consultar comentários por diferentes critérios.
 */
@Injectable()
export class CommentRepository {
  private readonly TABLE_NAME = 'Comments';

  constructor(private readonly dynamoDbService: DynamoDbService) { }

  /**
   * Cria um novo comentário no banco de dados.
   * @param createDto Dados para criar um comentário.
   * @returns Entidade do comentário criado.
   */
  async create(createDto: CreateCommentDto): Promise<CommentEntity> {
    const comment = new CommentEntity(createDto);
    const params = {
      TableName: this.TABLE_NAME,
      Item: comment,
    };
    await this.dynamoDbService.put(params);
    return comment;
  }

  /**
   * Busca um comentário pelo postId e timestamp.
   * @param postId ID do post relacionado ao comentário.
   * @param timestamp Timestamp do comentário.
   * @returns Entidade do comentário encontrada.
   * @throws NotFoundException se o comentário não for encontrado.
   */
  async findById(postId: string, timestamp: string): Promise<CommentEntity> {
    const params = {
      TableName: this.TABLE_NAME,
      Key: { 'COMMENT#postId': postId, TIMESTAMP: timestamp },
    };
    const result = await this.dynamoDbService.get(params);
    if (!result?.data?.Item) {
      throw new NotFoundException(`Comment with postId ${postId} and timestamp ${timestamp} not found`);
    }
    return new CommentEntity(result.data.Item);
  }

  /**
   * Atualiza um comentário existente.
   * @param postId ID do post relacionado ao comentário.
   * @param timestamp Timestamp do comentário.
   * @param updateDto Dados para atualizar o comentário.
   * @returns Entidade do comentário atualizada.
   */
  async update(postId: string, timestamp: string, updateDto: UpdateCommentDto): Promise<CommentEntity> {
    const existing = await this.findById(postId, timestamp);
    const updated = { ...existing, ...updateDto };
    const params = {
      TableName: this.TABLE_NAME,
      Item: updated,
    };
    await this.dynamoDbService.put(params);
    return new CommentEntity(updated);
  }

  /**
   * Remove um comentário do banco de dados.
   * @param postId ID do post relacionado ao comentário.
   * @param timestamp Timestamp do comentário.
   */
  async delete(postId: string, timestamp: string): Promise<void> {
    const params = {
      TableName: this.TABLE_NAME,
      Key: { 'COMMENT#postId': postId, TIMESTAMP: timestamp },
    };
    await this.dynamoDbService.delete(params);
  }

  /**
   * Busca todos os comentários de um post específico utilizando índice secundário (GSI_PostComments).
   * @param postId ID do post para buscar os comentários.
   * @returns Lista de comentários do post.
   */
  async findCommentsByPost(postId: string): Promise<CommentEntity[]> {
    const params = {
      TableName: this.TABLE_NAME,
      IndexName: 'GSI_PostComments',
      KeyConditionExpression: 'post_id = :postId',
      ExpressionAttributeValues: {
        ':postId': postId,
      },
      ScanIndexForward: true,
    };
    const result = await this.dynamoDbService.query(params);
    // Corrigido: Trata 'Items' como opcional e fornece fallback
    return result.data.Items?.map((item: Record<string, unknown>) => new CommentEntity(item)) ?? [];
  }

  /**
   * Busca todos os comentários de um usuário específico utilizando índice secundário (GSI_UserComments).
   * @param userId ID do usuário para buscar os comentários.
   * @returns Lista de comentários do usuário.
   */
  async findCommentsByUser(userId: string): Promise<CommentEntity[]> {
    const params = {
      TableName: this.TABLE_NAME,
      IndexName: 'GSI_UserComments',
      KeyConditionExpression: 'user_id = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: true,
    };
    const result = await this.dynamoDbService.query(params);
    // Corrigido: Trata 'Items' como opcional e fornece fallback
    return result.data.Items?.map((item: any) => new CommentEntity(item)) ?? [];
  }
}