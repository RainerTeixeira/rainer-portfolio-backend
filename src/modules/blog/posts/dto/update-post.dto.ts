import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsInt,
    IsOptional,
    IsPositive
} from 'class-validator';
import { CreatePostDto } from './create-post.dto';

export class UpdatePostDto extends PartialType(CreatePostDto) {
    @ApiProperty()
    @IsInt()
    @IsPositive()
    postId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Date)
    postLastUpdated?: Date;
}