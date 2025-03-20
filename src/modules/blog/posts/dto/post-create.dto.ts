/**
 * DTO para criação de um novo post.
 * Extende a classe PostBaseDto para reutilizar propriedades comuns.
 */
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PostBaseDto } from './post-base.dto';

export class PostCreateDto extends PostBaseDto {
  /**
   * ID da categoria e subcategoria concatenados.
   * @example '1#2'
   */
  @ApiProperty({ description: 'ID da categoria e subcategoria concatenados', example: '1#2' })
  @IsString()
  @IsNotEmpty()
  categoryIdSubcategoryId: string;

  /**
   * ID da categoria.
   * @example '1'
   */
  @ApiProperty({ description: 'ID da categoria', example: '1' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  /**
   * ID da subcategoria.
   * @example '2'
   */
  @ApiProperty({ description: 'ID da subcategoria', example: '2' })
  @IsString()
  @IsNotEmpty()
  subcategoryId: string;

  /**
   * ID do autor do post.
   * @example '1'
   */
  @ApiProperty({ description: 'ID do autor', example: '1' })
  @IsString()
  @IsNotEmpty()
  authorId: string;
}