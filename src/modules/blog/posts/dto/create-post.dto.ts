// src/posts/dto/create-post.dto.ts
import { OmitType } from '@nestjs/mapped-types';
import { BasePostDto } from './base-post.dto';

/**
 * DTO para criar um novo post.
 * Exclui campos gerenciados pelo sistema como `id`, `createdAt`, `lastUpdatedDate`, `views`, etc.
 */
export class CreatePostDto extends OmitType(BasePostDto, [
  'id',
  'createdAt',
  'lastUpdatedDate',
  'views',
  'likes',
  'commentCount',
] as const) { }
