import { IsString, IsNumber, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CreateAuthorCommentDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    emailHash: string;
}


export class CreateCommentDto {
    @IsNumber()
    @IsNotEmpty()
    postId: number;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsString()
    @IsNotEmpty()
    date: string;

    @ValidateNested()
    @Type(() => CreateAuthorCommentDto)
    author: CreateAuthorCommentDto;
}