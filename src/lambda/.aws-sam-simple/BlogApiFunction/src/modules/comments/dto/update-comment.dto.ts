/**
 * @fileoverview DTO de atualização de comentário
 *
 * Define o payload aceito para atualização parcial de um comentário.
 *
 * Observações:
 * - O backend pode restringir quais campos podem ser alterados dependendo de
 *   permissões/moderação.
 * - `status` é normalmente usado por fluxos de aprovação/rejeição.
 *
 * @module modules/comments/dto/update-comment.dto
 */

import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Payload para atualização de comentário.
 */
export class UpdateCommentDto {
  @ApiPropertyOptional({
    description: 'Conteúdo do comentário',
    example: 'Ótimo post! Parabéns pelo conteúdo.',
  })
  content?: string;

  @ApiPropertyOptional({
    description: 'Status do comentário',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    example: 'APPROVED',
  })
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}
