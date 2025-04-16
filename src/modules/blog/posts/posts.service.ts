import { Injectable, Inject, CACHE_MANAGER } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PostRepository } from './post.repository';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostEntity } from './post.entity';

@Injectable()
export class PostService {
  constructor(
    private readonly postRepository: PostRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) { }

  async create(createDto: CreatePostDto): Promise<PostEntity> {
    const post = await this.postRepository.create(createDto);
    await this.cacheManager.del(`post_${post.id}`);
    return post;
  }

  async findById(id: string): Promise<PostEntity> {
    const cacheKey = `post_${id}`;
    let post: PostEntity = await this.cacheManager.get(cacheKey);
    if (!post) {
      post = await this.postRepository.findById(id);
      await this.cacheManager.set(cacheKey, post);
    }
    return post;
  }

  async update(id: string, updateDto: UpdatePostDto): Promise<PostEntity> {
    const post = await this.postRepository.update(id, updateDto);
    await this.cacheManager.set(`post_${id}`, post);
    return post;
  }

  async delete(id: string): Promise<void> {
    await this.postRepository.delete(id);
    await this.cacheManager.del(`post_${id}`);
  }

  async findPostsByAuthor(authorId: string): Promise<PostEntity[]> {
    return await this.postRepository.findPostsByAuthor(authorId);
  }

  async findPostsByCategory(categoryId: string): Promise<PostEntity[]> {
    return await this.postRepository.findPostsByCategory(categoryId);
  }

  async findRecentPosts(): Promise<PostEntity[]> {
    return await this.postRepository.findRecentPosts();
  }

  async findBySlug(slug: string): Promise<PostEntity> {
    return await this.postRepository.findBySlug(slug);
  }
}
