import { IsOptional, IsString } from 'class-validator'; // Import decorators de validação

export class UpdateSubcategoryDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    keywords?: string;

    @IsOptional()
    @IsString()
    title?: string;

    constructor(name?: string, slug?: string, description?: string, keywords?: string, title?: string) {
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.keywords = keywords;
        this.title = title;
    }
}