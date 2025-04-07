// src/modules/blog/posts/dto/post-content.dto.ts
import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PostBaseDto } from './post-base.dto';

export class PostContentDto extends PostBaseDto {
    @ApiProperty({ description: 'ID do post' })
    @IsString()
    postId: string;

    // Removido 'content: string;' pois parece redundante com 'contentHTML'
    // Se 'content' for um campo separado (ex: texto puro), adicione-o ao DynamoDB e DTO.

    @ApiProperty({ description: 'Número de visualizações do post' })
    @IsNumber()
    views: number;

    @ApiProperty({ description: 'ID da categoria' })
    @IsString()
    categoryId: string;

    @ApiProperty({ description: 'ID da subcategoria' })
    @IsString()
    subcategoryId: string;

    @ApiProperty({ description: 'ID do autor do post' })
    @IsString()
    authorId: string;

    @ApiProperty({ description: 'Data de modificação do post (ISO 8601)' })
    @IsString() // Ou IsISO8601
    modifiedDate: string;
}