// base-comment.dto.ts
import { IsString, IsOptional, IsIn } from 'class-validator'; // Adicione IsIn

export class BaseCommentDto {
    @IsString()
    post_id: string;

    @IsString()
    user_id: string;

    @IsString()
    text: string;

    @IsString()
    @IsIn(['pendente', 'aprovado', 'rejeitado']) // Agora reconhecido
    @IsOptional()
    status?: string;

    @IsOptional()
    @IsString()
    parent_comment_id?: string;
}