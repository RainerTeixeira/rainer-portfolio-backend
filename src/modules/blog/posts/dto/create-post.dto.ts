import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested
} from 'class-validator';

export class CreateCategoryDto {
  @IsInt()
  @IsPositive()
  categoryId: number;

  @IsInt()
  @IsPositive()
  subCategoryId: number;
}

export class CreatePostDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  postTitle: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  postSummary: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  postContent: string;

  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  authorIds: number[];

  @ApiProperty()
  @IsDefined()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => CreateCategoryDto)
  category: CreateCategoryDto;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  postTags?: string[];

  @ApiProperty()
  @IsInt()
  @IsPositive()
  postReadingTime: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  postDate?: string;
}