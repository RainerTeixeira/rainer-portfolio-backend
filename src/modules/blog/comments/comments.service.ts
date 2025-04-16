import { Injectable, Inject, CACHE_MANAGER } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CommentRepository } from './comment.repository';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentEntity } from './comment.entity';

@Injectable()
export class CommentService {
    constructor(
        private readonly commentRepository: CommentRepository,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) { }

    async create(createDto: CreateCommentDto): Promise<CommentEntity> {
        const comment = await this.commentRepository.create(createDto);
        await this.cacheManager.del(`comment_${comment.postId}_${comment.timestamp}`);
        return comment;
    }

    async findById(postId: string, timestamp: string): Promise<CommentEntity> {
        const cacheKey = `comment_${postId}_${timestamp}`;
        let comment: CommentEntity = await this.cacheManager.get(cacheKey);
        if (!comment) {
            comment = await this.commentRepository.findById(postId, timestamp);
            await this.cacheManager.set(cacheKey, comment);
        }
        return comment;
    }

    async update(postId: string, timestamp: string, updateDto: UpdateCommentDto): Promise<CommentEntity> {
        const comment = await this.commentRepository.update(postId, timestamp, updateDto);
        await this.cacheManager.set(`comment_${postId}_${timestamp}`, comment);
        return comment;
    }

    async delete(postId: string, timestamp: string): Promise<void> {
        await this.commentRepository.delete(postId, timestamp);
        await this.cacheManager.del(`comment_${postId}_${timestamp}`);
    }

    async findCommentsByPost(postId: string): Promise<CommentEntity[]> {
        return await this.commentRepository.findCommentsByPost(postId);
    }

    async findCommentsByUser(userId: string): Promise<CommentEntity[]> {
        return await this.commentRepository.findCommentsByUser(userId);
    }
}
