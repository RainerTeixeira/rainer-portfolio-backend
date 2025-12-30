/**
 * @fileoverview DTO de criação de notificação
 *
 * Define o payload aceito para criar notificações.
 *
 * Observações de domínio:
 * - `relatedId` e `relatedType` permitem relacionar a notificação com um recurso
 *   do sistema (post, comentário, usuário).
 * - `actionUrl` é uma URL relativa usada por clientes para redirecionamento.
 * - `isRead` geralmente começa como `false` e é atualizado via endpoints de leitura.
 *
 * @module modules/notifications/dto/create-notification.dto
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Payload para criação de notificação.
 */
export class CreateNotificationDto {
  @ApiProperty({
    description: 'ID do usuário que receberá a notificação',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  userId: string;

  @ApiProperty({
    description: 'Título da notificação',
    example: 'Nova curtida no seu post',
  })
  title: string;

  @ApiProperty({
    description: 'Mensagem da notificação',
    example: 'Alguém curtiu seu post sobre NestJS',
  })
  message: string;

  @ApiProperty({
    description: 'Tipo da notificação',
    enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR'],
    example: 'INFO',
  })
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

  @ApiPropertyOptional({
    description: 'Se a notificação foi lida',
    example: false,
  })
  isRead?: boolean;

  @ApiPropertyOptional({
    description: 'ID do item relacionado',
    example: 'post-123456',
  })
  relatedId?: string;

  @ApiPropertyOptional({
    description: 'Tipo do item relacionado',
    enum: ['POST', 'COMMENT', 'USER'],
    example: 'POST',
  })
  relatedType?: 'POST' | 'COMMENT' | 'USER';

  @ApiPropertyOptional({
    description: 'URL para ação da notificação',
    example: '/posts/post-123456',
  })
  actionUrl?: string;
}
