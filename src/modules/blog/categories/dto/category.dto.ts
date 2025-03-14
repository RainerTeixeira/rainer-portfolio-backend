import { ApiProperty } from '@nestjs/swagger';

export class CategoryDto {
    @ApiProperty({
        description: 'ID único da categoria',
        example: '12345',
    })
    categoryId: string;

    @ApiProperty({
        description: 'Nome da categoria',
        example: 'Tecnologia',
    })
    name: string;

    @ApiProperty({
        description: 'Descrição da categoria',
        example: 'Categoria relacionada a artigos de tecnologia',
    })
    description: string;
}
