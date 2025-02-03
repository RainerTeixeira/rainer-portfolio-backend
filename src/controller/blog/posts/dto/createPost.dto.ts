// src/controller/blog/posts/dto/createPost.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title?: string;  // Torne a propriedade opcional

  @IsString()
  @IsNotEmpty()
  content?: string;  // Torne a propriedade opcional

  @IsString()
  @IsOptional()
  authorId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];
}
