import { IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CreateSeoDto {
    @IsString()
    @IsNotEmpty()
    metaTitle: string;
    // priority pode ser omitido na criação
}

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    slug: string;

    @ValidateNested()
    @Type(() => CreateSeoDto)
    seo: CreateSeoDto;
}