// create-comment.dto.ts
import { BaseCommentDto } from './base-comment.dto';
import { IsNotEmpty } from 'class-validator';

export class CreateCommentDto extends BaseCommentDto {
    @IsNotEmpty()
    id!: string;

    @IsNotEmpty()
    created_at!: string;
}