import { ApiProperty } from '@nestjs/swagger';

export class CategoryDto {
  @ApiProperty({ example: '123', description: 'O identificador único da categoria' })
  id: string;

  @ApiProperty({ example: 'Tecnologia', description: 'O nome da categoria' })
  name: string;

  @ApiProperty({ example: 'tecnologia', description: 'O slug da categoria' })
  slug: string;

  @ApiProperty({ example: 'Categoria relacionada a tecnologia e inovações', description: 'A descrição da categoria' })
  description: string;
}