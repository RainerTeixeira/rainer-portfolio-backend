// update-comment.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { BaseCommentDto } from './base-comment.dto';
import { IsNotEmpty } from 'class-validator';

export class UpdateCommentDto extends PartialType(BaseCommentDto) {
    @IsNotEmpty()
    updated_at!: string;
}