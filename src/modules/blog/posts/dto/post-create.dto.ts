import { IsString, IsNotEmpty, IsISO8601 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PostBaseDto } from './post-base.dto';

export class PostCreateDto extends PostBaseDto {
  @ApiProperty({ description: 'ID da categoria e subcategoria concatenados', example: '1#2' })
  @IsString()
  @IsNotEmpty()
  categoryIdSubcategoryId: string;

  @ApiProperty({ description: 'ID da categoria', example: '1' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ description: 'ID da subcategoria', example: '2' })
  @IsString()
  @IsNotEmpty()
  subcategoryId: string;

  @ApiProperty({ description: 'ID do autor', example: '1' })
  @IsString()
  @IsNotEmpty()
  authorId: string;

  @ApiProperty({ description: 'Data de publicação (ISO 8601)', example: '2024-09-15T10:00:00Z' })
  @IsISO8601()
  @IsNotEmpty()
  publishDate: string;
}
