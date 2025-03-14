import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCategoryDto {
    @ApiProperty({
        description: 'Nome da categoria',
        example: 'Tecnologia',
        required: false,
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({
        description: 'Descrição da categoria',
        example: 'Categoria relacionada a artigos de tecnologia',
        required: false,
    })
    @IsOptional()
    @IsString()
    description?: string;
}
