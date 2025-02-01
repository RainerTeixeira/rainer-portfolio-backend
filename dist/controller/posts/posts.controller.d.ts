import { CreatePostDto, UpdatePostDto } from './dto';
export declare class PostsController {
    create(createPostDto: CreatePostDto): Promise<Record<string, any>>;
    findOne(id: string): Promise<Record<string, any>>;
    update(id: string, updatePostDto: UpdatePostDto): Promise<Record<string, any>>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
}
