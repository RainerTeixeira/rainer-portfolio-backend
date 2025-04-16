// src/posts/dto/summary-post.dto.ts
import { PickType } from '@nestjs/mapped-types';
import { BasePostDto } from './base-post.dto';

/**
 * DTO de resposta com resumo de um post.
 * Ideal para listagens, feeds ou cards.
 */
export class SummaryPostDto extends PickType(BasePostDto, [
    'id',
    'title',
    'slug',
    'excerpt',
    'authorId',
    'categoryId',
    'subcategoryId',
    'tags',
    'postPictureUrl',
    'publishDate',
    'likes',
    'views',
    'commentCount',
] as const) { }
