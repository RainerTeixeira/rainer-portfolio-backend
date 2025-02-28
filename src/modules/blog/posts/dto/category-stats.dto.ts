import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostSummaryDto } from './blog-summary.dto';
import { IsUUID, IsString, IsNumber } from 'class-validator';

export class CategoryStatsDto {
    @ApiProperty({
        description: 'ID da categoria',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsUUID()
    id: string;

    @ApiProperty({
        description: 'Nome da categoria',
        example: 'Tecnologia',
    })
    @IsString()
    name: string;

    @ApiProperty({
        description: 'Número de posts na categoria',
        example: 10,
    })
    @IsNumber()
    postCount: number;

    @ApiPropertyOptional({
        description: 'Último post da categoria',
        type: PostSummaryDto,
    })
    latestPost?: PostSummaryDto;
}