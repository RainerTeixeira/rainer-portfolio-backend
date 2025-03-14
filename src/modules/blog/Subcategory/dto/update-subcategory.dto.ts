import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSubcategoryDto {
  @ApiProperty({ description: 'Nome da subcategoria', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Slug da subcategoria', required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ description: 'Descrição da subcategoria', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Palavras-chave da subcategoria', required: false })
  @IsOptional()
  @IsString()
  keywords?: string;

  @ApiProperty({ description: 'Título da subcategoria', required: false })
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