// src/modules/blog/authors/dto/author.dto.ts

export class AuthorDto {
    postId: string;
    authorId: string;
    name: string;
    slug: string;
    expertise: string[];
    socialProof: { [key: string]: string };

    constructor(
        postId: string,
        authorId: string,
        name: string,
        slug: string,
        expertise: string[],
        socialProof: { [key: string]: string }
    ) {
        this.postId = postId;
        this.authorId = authorId;
        this.name = name;
        this.slug = slug;
        this.expertise = expertise;
        this.socialProof = socialProof;
    }
}