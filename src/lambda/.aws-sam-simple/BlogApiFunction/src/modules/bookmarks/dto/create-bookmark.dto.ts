/**
 * @fileoverview DTO de criação de bookmark
 *
 * Define o payload aceito para criar um bookmark (favorito).
 *
 * Regras de uso (contrato):
 * - `userId` é obrigatório.
 * - Deve ser informado **exatamente um** entre `postId` ou `commentId`.
 *   (A validação dessa regra pode ocorrer no controller/service/repositório.)
 *
 * @module modules/bookmarks/dto/create-bookmark.dto
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Payload para criação de bookmark.
 */
export class CreateBookmarkDto {
  @ApiProperty({
    description: 'ID do usuário que está favoritando',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  userId: string;

  @ApiPropertyOptional({
    description: 'ID do post sendo favoritado',
    example: 'post-123456',
  })
  postId?: string;

  @ApiPropertyOptional({
    description: 'ID do comentário sendo favoritado',
    example: 'comment-789',
  })
  commentId?: string;
}
