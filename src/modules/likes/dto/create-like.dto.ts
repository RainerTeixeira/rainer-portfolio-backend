/**
 * @fileoverview DTO de criação de like
 *
 * Define o payload aceito para registrar uma curtida (like).
 *
 * Regras de uso (contrato):
 * - `userId` é obrigatório.
 * - Deve ser informado **exatamente um** entre `postId` ou `commentId`.
 *
 * @module modules/likes/dto/create-like.dto
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Payload para criação de curtida.
 */
export class CreateLikeDto {
  @ApiProperty({
    description: 'ID do usuário que está curtindo',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  userId: string;

  @ApiPropertyOptional({
    description: 'ID do post sendo curtido',
    example: 'post-123456',
  })
  postId?: string;

  @ApiPropertyOptional({
    description: 'ID do comentário sendo curtido',
    example: 'comment-789',
  })
  commentId?: string;
}
