/**
 * @fileoverview DTO de criação de comentário
 *
 * Define o payload aceito para criação de comentários.
 *
 * Observações de domínio:
 * - `parentId` permite replies (comentários em árvore).
 * - `status` pode ser enviado, mas normalmente é definido pelo backend como `PENDING`
 *   e alterado via moderação.
 *
 * @module modules/comments/dto/create-comment.dto
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Payload para criação de comentário.
 */
export class CreateCommentDto {
  @ApiProperty({
    description: 'Conteúdo do comentário',
    example: 'Ótimo post! Parabéns pelo conteúdo.',
  })
  content: string;

  @ApiProperty({
    description: 'ID do autor do comentário',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  authorId: string;

  @ApiProperty({
    description: 'ID do post onde o comentário foi feito',
    example: 'post-123456',
  })
  postId: string;

  @ApiPropertyOptional({
    description: 'ID do comentário pai (se for uma resposta)',
    example: 'comment-789',
  })
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Status do comentário',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    example: 'PENDING',
  })
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}
