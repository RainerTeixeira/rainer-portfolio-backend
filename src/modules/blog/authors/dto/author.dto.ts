import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class AuthorDto {
    @IsNumber()
    authorId: number;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    bio: string;

    @IsString()
    @IsNotEmpty()
    imageUrl: string;
}