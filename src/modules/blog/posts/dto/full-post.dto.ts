import { PostDto } from './post.dto';
import { AuthorDto } from '../../authors/dto/author.dto';
import { CommentDto } from '../../comments/dto/comment.dto'; // Crie este DTO se ainda não existir

export class FullPostDto extends PostDto {
    author?: AuthorDto;
    comments?: CommentDto[];

    constructor(post: PostDto, author?: AuthorDto, comments?: CommentDto[]) {
        super(
            post['categoryId#subcategoryId'],
            post.postId,
            post.categoryId,
            post.subcategoryId,
            post.contentHTML,
            post.postInfo,
            post.seo
        );
        this.author = author;
        this.comments = comments;
    }
}