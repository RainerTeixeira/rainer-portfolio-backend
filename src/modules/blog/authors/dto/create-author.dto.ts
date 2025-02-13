import { IsString, IsNotEmpty } from 'class-validator';

export class CreateAuthorDto {
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