// src/posts/dto/update-post.dto.ts
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { BasePostDto } from './base-post.dto';

/**
 * DTO para atualização de post.
 * Permite atualização parcial de todos os campos, exceto os gerenciados pelo sistema.
 */
export class UpdatePostDto extends PartialType(
    OmitType(BasePostDto, [
        'id',
        'createdAt',
        'views',
        'likes',
        'commentCount',
    ] as const),
) { }
