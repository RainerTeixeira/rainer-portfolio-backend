import { ApiProperty } from '@nestjs/swagger';
import { PostContentDto } from '@src/modules/blog/posts/dto/post-content.dto';
import { AuthorDto } from '@src/modules/blog/authors/dto/author-detail.dto';
import { CategoryDto } from '@src/modules/blog/category/dto/category.dto';
import { SubcategoryDto } from '@src/modules/blog/subcategory/dto/subcategory.dto';
import { CommentDto } from '@src/modules/blog/comments/dto/comment.dto';

/**
 * Data Transfer Object (DTO) que representa um post completo no sistema.
 * 
 * Esta classe inclui informações detalhadas sobre o post, autor, categoria,
 * subcategoria e comentários associados.
 */
export class PostFullDto {
    @ApiProperty({ type: PostContentDto })
    post: PostContentDto;

    @ApiProperty({ type: AuthorDto })
    author: AuthorDto;

    @ApiProperty({ type: CategoryDto })
    category: CategoryDto;

    @ApiProperty({ type: SubcategoryDto })
    subcategory: SubcategoryDto;

    @ApiProperty({ type: [CommentDto] })
    comments: CommentDto[];

    @ApiProperty({ description: 'Slug do post', example: 'guia-definitivo-apis-nestjs' })
    slug: string; // Adicionado o campo slug
}