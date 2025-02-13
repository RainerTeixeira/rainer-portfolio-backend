import { IsString, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class UpdateAuthorCommentDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    emailHash?: string;
}

export class UpdateCommentDto {
    @IsOptional()
    @IsNumber()
    postId?: number;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsString()
    date?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateAuthorCommentDto)
    author?: UpdateAuthorCommentDto;

    @IsOptional()
    @IsString()
    status?: string;
}