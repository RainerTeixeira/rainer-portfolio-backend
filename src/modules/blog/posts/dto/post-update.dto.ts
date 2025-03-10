import { IsNumber, IsOptional, IsISO8601 } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PostBaseDto } from './post-base.dto';

export class PostUpdateDto extends PostBaseDto {
    @ApiPropertyOptional({ description: 'Data de modificação (ISO 8601)', example: '2024-09-20T12:00:00Z' })
    @IsISO8601()
    @IsOptional()
    modifiedDate?: string;

    @ApiPropertyOptional({ description: 'Número de visualizações do post', example: 2500 })
    @IsNumber()
    @IsOptional()
    views?: number;
}
