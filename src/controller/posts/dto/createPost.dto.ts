import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class CreatePostDto {
    @IsString()
    @IsNotEmpty()
    postTitle: string;

    @IsString()
    @IsNotEmpty()
    postContent: string;

    @IsArray()
    @IsNotEmpty()
    postTags: string[];
}