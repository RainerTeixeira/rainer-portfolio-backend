// base-comment.dto.ts
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class BaseCommentDto {
    @IsString()
    post_id: string;

    @IsString()
    user_id: string;

    @IsString()
    text: string;

    @IsString()
    @IsIn(['pendente', 'aprovado', 'rejeitado'])
    @IsOptional()
    status?: string;

    @IsOptional()
    @IsString()
    parent_comment_id?: string;
}