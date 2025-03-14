import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
    @ApiProperty({
        description: 'ID único da categoria',
        example: '12345',
    })
    @IsNotEmpty()
    @IsString()
    categoryId: string;

    @ApiProperty({
        description: 'Nome da categoria',
        example: 'Tecnologia',
    })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({
        description: 'Descrição da categoria',
        example: 'Categoria relacionada a artigos de tecnologia',
        required: false,
    })
    @IsOptional()
    @IsString()
    description?: string;

    constructor(categoryId: string, name: string, description?: string) {
        this.categoryId = categoryId;
        this.name = name;
        this.description = description;
    }
}
