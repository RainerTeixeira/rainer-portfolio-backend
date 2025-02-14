// src/modules/blog/posts/services/posts.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from '@src/modules/blog/posts/dto/create-post.dto';
import { UpdatePostDto } from '@src/modules/blog/posts/dto/update-post.dto';
import { PostDto } from '@src/modules/blog/posts/dto/post.dto';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

@Injectable()
export class PostsService {
  private readonly tableName = 'Posts';

  constructor(private readonly dynamoDbService: DynamoDbService) { }

  async create(createPostDto: CreatePostDto): Promise<PostDto> {
    const params = {
      TableName: this.tableName,
      Item: createPostDto,
    };
    await this.dynamoDbService.putItem(params);
    return this.findOne(createPostDto.categoryId + '#' + createPostDto.subcategoryId); // Removed postId argument
  }

  async findAll(): Promise<PostDto[]> {
    const result = await this.dynamoDbService.scan({ TableName: this.tableName });
    return (result.Items || []).map(item => this.mapPostFromDynamoDb(item));
  }

  async findOne(categoryIdSubcategoryId: string): Promise<PostDto> { // Only categoryIdSubcategoryId
    const [categoryId, subcategoryId] = categoryIdSubcategoryId.split('#'); // Destructure
    const params = {
      TableName: this.tableName,
      Key: {
        'categoryId#subcategoryId': { S: categoryIdSubcategoryId },
        postId: { S: createPostDto.postId }, // Add postId to the query
      },
    };
    const result = await this.dynamoDbService.getItem(params);
    if (!result.Item) {
      throw new NotFoundException(`Post com ID '${createPostDto.postId}' na categoria '${categoryIdSubcategoryId}' não encontrado`);
    }
    return this.mapPostFromDynamoDb(result.Item);
  }

  async update(categoryIdSubcategoryId: string, postId: string, updatePostDto: UpdatePostDto): Promise<PostDto> {
    await this.findOne(categoryIdSubcategoryId); // Only categoryIdSubcategoryId

    const params: UpdateCommandInput = {
      TableName: this.tableName,
      Key: {
        'categoryId#subcategoryId': { S: categoryIdSubcategoryId },
        postId: { S: postId },
      },
      UpdateExpression: 'SET contentHTML = :contentHTML, excerpt = :excerpt, publishDate = :publishDate, slug = :slug, title = :title, postInfo = :postInfo, seo = :seo, #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':contentHTML': { S: updatePostDto.contentHTML },
        ':excerpt': { S: updatePostDto.excerpt },
        ':publishDate': { S: updatePostDto.publishDate },
        ':slug': { S: updatePostDto.slug },
        ':title': { S: updatePostDto.title },
        ':postInfo': {
          M: {
            authorId: { S: updatePostDto.postInfo?.authorId || null },
            tags: { L: updatePostDto.postInfo?.tags?.map(tag => ({ S: tag })) || [] },
          }
        },
        ':seo': {
          M: {
            canonical: { S: updatePostDto.seo?.canonical || null },
            description: { S: updatePostDto.seo?.description || null },
            keywords: { L: updatePostDto.seo?.keywords?.map(keyword => ({ S: keyword })) || [] },
          }
        },
        ':status': { S: updatePostDto.status || 'draft' },
      },
      ReturnValues: 'ALL_NEW',
    };

    const result = await this.dynamoDbService.updateItem(params);
    return this.mapPostFromDynamoDb(result.Attributes as Record<string, any>) as PostDto;
  }

  async remove(categoryIdSubcategoryId: string, postId: string): Promise<void> {
    await this.findOne(categoryIdSubcategoryId); // Only categoryIdSubcategoryId

    const params = {
      TableName: this.tableName,
      Key: {
        'categoryId#subcategoryId': { S: categoryIdSubcategoryId },
        postId: { S: postId },
      },
    };
    await this.dynamoDbService.deleteItem(params);
  }

  private mapPostFromDynamoDb(item: Record<string, any>): PostDto {
    return {
      'categoryId#subcategoryId': item['categoryId#subcategoryId']?.S,
      postId: item.postId?.S,
      categoryId: item.categoryId?.S,
      subcategoryId: item.subcategoryId?.S,
      contentHTML: item.contentHTML?.S,
      postInfo: {
        authorId: item.postInfo?.M?.authorId?.S,
        tags: item.postInfo?.M?.tags?.L?.map((tagItem: any) => tagItem.S) || [],
        likes: Number(item.postInfo?.M?.likes?.N),
        views: Number(item.postInfo?.M?.views?.N),
      },
      excerpt: item.excerpt?.S,
      publishDate: item.publishDate?.S,
      slug: item.slug?.S,
      title: item.title?.S,
      status: item.status?.S,
      seo: {
        canonical: item.seo?.M?.canonical?.S,
        description: item.seo?.M?.description?.S,
        keywords: item.seo?.M?.keywords?.L?.map((keywordItem: any) => keywordItem.S) || []
      },
    } as PostDto;
  }
}