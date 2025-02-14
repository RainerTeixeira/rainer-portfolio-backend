// src/modules/blog/posts/dto/create-post.dto.ts
import { IsString, IsOptional, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { PostInfoDto } from './post-info.dto';
import { PostSeoDto } from './post-seo.dto';

/**
 * DTO (Data Transfer Object) para criar um novo Post.
 * Define a estrutura dos dados necessários para criar um post,
 * incluindo validações para garantir a integridade dos dados.
 */
export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  subcategoryId: string;

  @IsString()
  @IsNotEmpty()
  contentHTML: string;

  @ValidateNested()
  @Type(() => PostInfoDto)
  @IsNotEmpty()
  postInfo: PostInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PostSeoDto)
  seo?: PostSeoDto;

  /**
   * Construtor para CreatePostDto.
   * Inicializa as propriedades do DTO.
   */
  constructor(
    categoryId: string,
    subcategoryId: string,
    contentHTML: string,
    postInfo: PostInfoDto,
    seo?: PostSeoDto,
  ) {
    this.categoryId = categoryId;
    this.subcategoryId = subcategoryId;
    this.contentHTML = contentHTML;
    this.postInfo = postInfo;
    this.seo = seo;
  }
}