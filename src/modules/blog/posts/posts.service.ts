// src/modules/blog/posts/posts.service.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PostRepository } from './post.repository';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostEntity } from './post.entity';

export type SortOrder = 'asc' | 'desc';

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
    let post = await this.cacheManager.get<PostEntity>(cacheKey);
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

  async findPostsByAuthor(
    authorId: string,
    sort: SortOrder = 'desc',
  ): Promise<PostEntity[]> {
    const posts = await this.postRepository.findPostsByAuthor(authorId);
    return posts.sort((a, b) =>
      sort === 'asc'
        ? new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()
        : new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(),
    );
  }

  async findPostsByCategory(categoryId: string): Promise<PostEntity[]> {
    return this.postRepository.findPostsByCategory(categoryId);
  }

  async findRecentPosts(limit = 10): Promise<PostEntity[]> {
    const posts = await this.postRepository.findRecentPosts();
    return posts.slice(0, limit);
  }

  async findPopularByCategory(
    categoryId: string,
    limit = 10,
  ): Promise<PostEntity[]> {
    const posts = await this.postRepository.findPostsByCategory(categoryId);
    return posts
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }

  async findBySlug(slug: string): Promise<PostEntity> {
    return this.postRepository.findBySlug(slug);
  }
}