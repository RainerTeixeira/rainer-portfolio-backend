import { PostDto } from './post.dto';
import { AuthorDto } from '../../authors/dto/author.dto';
import { CommentDto } from '../../comments/dto/comment.dto'; // Crie este DTO se ainda não existir

export class FullPostDto extends PostDto {
    author?: AuthorDto;
    comments?: CommentDto[]; // Array de CommentDto
}