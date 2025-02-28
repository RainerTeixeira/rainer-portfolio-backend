import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsUrl,
    IsISO8601,
    IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PostSummaryDto {
    @ApiProperty({
        description: 'ID único do post',
        example: '550e8400-e29b-41d4-a716-446655440003',
    })
    @IsUUID()
    postId: string;

    @ApiProperty({
        description: 'Título do post',
        example: 'Título do Post',
    })
    @IsString()
    title: string;

    @ApiPropertyOptional({
        description: 'URL da imagem destacada',
        example: 'https://example.com/image.jpg',
    })
    @IsUrl()
    @IsOptional()
    featuredImage?: string;

    @ApiProperty({
        description: 'Data de publicação no formato ISO 8601',
        example: '2024-01-01T12:00:00Z',
    })
    @IsISO8601()
    publishDate: string;

    @ApiProperty({
        description: 'Tempo estimado de leitura em minutos',
        example: 5,
    })
    @IsNumber()
    readingTime: number;
}