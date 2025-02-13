import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostDto } from './dto/post.dto';
import { DynamoDbService } from '../../../services/dynamoDb.service'; // Importe seu DynamoDbService
import * as AWS from 'aws-sdk'; // Importe AWS SDK para tipos

@Injectable()
export class PostsService {
  constructor(
    @Inject(DynamoDbService) private dynamoDbService: DynamoDbService, // Injete seu DynamoDbService
  ) { }

  private postsTable = 'Posts';

  async create(createPostDto: CreatePostDto): Promise<PostDto> {
    const postId = Date.now();
    const postDate = new Date().toISOString();

    const params = {
      TableName: this.postsTable,
      Item: {
        postId: { N: String(postId) },
        postDate: { S: postDate }, // Chave de ordenação
        slug: { S: createPostDto.slug },
        dateModified: { S: postDate }, // Pode ser atualizado depois
        content: this.convertContentDtoToDynamoDB(createPostDto.content),
        engagement: this.convertEngagementDtoToDynamoDB(createPostDto.engagement),
        media: this.convertMediaDtoToDynamoDB(createPostDto.media),
        seo: this.convertSeoDtoToDynamoDB(createPostDto.seo),
      },
    };
    await this.dynamoDbService.put(params).catch(err => {
      console.error('DynamoDB Put Error:', err);
      throw err;
    });

    return this.findOne(postId, postDate); // Busca o post recém-criado
  }

  async findAllPaginated(page: number, limit: number): Promise<{ data: PostDto[]; total: number; page: number; limit: number }> {
    const startIndex = (page - 1) * limit;

    const scanParams: AWS.DynamoDB.DocumentClient.ScanInput = {
      TableName: this.postsTable,
      Limit: limit, // Limite por página
      // ... (PAGINATION COM ExclusiveStartKey seria mais eficiente em produção, usar depois)
    };

    const countParams = { // Para contar o total (SCAN para contagem pode ser caro em tabelas grandes, considerar outras estratégias em produção)
      TableName: this.postsTable,
      Select: 'COUNT',
    };

    const [scanResult, countResult] = await Promise.all([
      this.dynamoDbService.scan(scanParams),
      this.dynamoDbService.scan(countParams), // **CUIDADO**: Scan para contagem pode ser caro em tabelas grandes
    ]).catch(err => {
      console.error('DynamoDB Scan/Count Error:', err);
      throw err;
    });

    const items = scanResult.Items || [];
    const total = countResult.Count || 0;
    const posts = items.map(item => this.parsePostFromDynamoDB(item)) as PostDto[];

    return {
      data: posts,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number, postDate: string): Promise<PostDto> {
    const params = {
      TableName: this.postsTable,
      Key: {
        postId: { N: String(id) },
        postDate: { S: postDate }, // Busca pela chave primária composta (postId, postDate)
      },
    };
    const result = await this.dynamoDbService.get(params).catch(err => {
      console.error('DynamoDB Get Error:', err);
      throw err;
    });

    if (!result.Item) {
      throw new NotFoundException(`Post with ID ${id} and date ${postDate} not found`);
    }
    return this.parsePostFromDynamoDB(result.Item) as PostDto;
  }

  async update(id: number, postDate: string, updatePostDto: UpdatePostDto): Promise<PostDto> {
    const updateParams: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
      TableName: this.postsTable,
      Key: {
        postId: { N: String(id) },
        postDate: { S: postDate },
      },
      UpdateExpression: `SET dateModified = :dateModified, slug = :slug,
                         content.html = :html, content.readingTime = :readingTime,
                         engagement.views = :views, engagement.socialShares = :socialShares, engagement.avgTimeOnPage = :avgTimeOnPage,
                         seo.canonicalUrl = :canonicalUrl, seo.metaDescription = :metaDescription, seo.title = :seoTitle, seo.keywords = :keywords,
                         media.images = :images, media.videos = :videos,
                         content.sections = :sections, content.references = :references`,
      ExpressionAttributeValues: {
        ':dateModified': new Date().toISOString(),
        ':slug': updatePostDto.slug,
        ':html': updatePostDto.content?.html,
        ':readingTime': updatePostDto.content?.readingTime != null ? { N: String(updatePostDto.content.readingTime) } : { N: '0' },
        ':views': updatePostDto.engagement?.views != null ? { N: String(updatePostDto.engagement.views) } : { N: '0' },
        ':socialShares': updatePostDto.engagement?.socialShares != null ? { N: String(updatePostDto.engagement.socialShares) } : { N: '0' },
        ':avgTimeOnPage': updatePostDto.engagement?.avgTimeOnPage != null ? { N: String(updatePostDto.engagement.avgTimeOnPage) } : { N: '0' },
        ':canonicalUrl': updatePostDto.seo?.canonicalUrl,
        ':metaDescription': updatePostDto.seo?.metaDescription,
        ':seoTitle': updatePostDto.seo?.title,
        ':keywords': updatePostDto.seo?.keywords ? { L: updatePostDto.seo.keywords.map(keyword => ({ S: keyword })) } : { L: [] },
        ':images': updatePostDto.media?.images ? { L: updatePostDto.media.images.map(imageDto => ({ M: this.convertImageDtoToDynamoDB(imageDto) })) } : { L: [] },
        ':videos': updatePostDto.media?.videos ? { L: updatePostDto.media.videos.map(videoDto => ({ M: this.convertVideoDtoToDynamoDB(videoDto) })) } : { L: [] },
        ':sections': updatePostDto.content?.sections ? { L: updatePostDto.content.sections.map(sectionDto => ({ M: this.convertSectionDtoToDynamoDB(sectionDto) })) } : { L: [] },
        ':references': updatePostDto.content?.references ? { L: updatePostDto.content.references.map(refDto => ({ M: this.convertReferenceDtoToDynamoDB(refDto) })) } : { L: [] },

      },
      ReturnValues: 'ALL_NEW',
    };

    const result = await this.dynamoDbService.update(updateParams).catch(err => {
      console.error('DynamoDB Update Error:', err);
      throw err;
    });

    return this.parsePostFromDynamoDB(result.Attributes) as PostDto;
  }


  async remove(id: number, postDate: string): Promise<void> {
    const params = {
      TableName: this.postsTable,
      Key: {
        postId: { N: String(id) },
        postDate: { S: postDate }, // Chave primária composta para delete
      },
    };
    await this.dynamoDbService.delete(params).catch(err => {
      console.error('DynamoDB Delete Error:', err);
      throw err;
    });
  }

  private parsePostFromDynamoDB(item: AWS.DynamoDB.DocumentClient.AttributeMap): PostDto {
    return {
      postId: Number(item.postId.N),
      postDate: item.postDate.S,
      slug: item.slug.S,
      dateModified: item.dateModified.S,
      content: this.parseContentFromDynamoDB(item.content.M),
      engagement: this.parseEngagementFromDynamoDB(item.engagement.M),
      media: this.parseMediaFromDynamoDB(item.media.M),
      seo: this.parseSeoFromDynamoDB(item.seo.M),
    } as PostDto;
  }

  private parseContentFromDynamoDB(contentMap: AWS.DynamoDB.DocumentClient.MapAttributeValue): ContentPostDto {
    return {
      html: contentMap.html.S,
      readingTime: Number(contentMap.readingTime.N),
      sections: (contentMap.sections.L || []).map(sectionItem => this.parseSectionFromDynamoDB(sectionItem.M)),
      references: (contentMap.references.L || []).map(refItem => this.parseReferenceFromDynamoDB(refItem.M)),
    } as ContentPostDto;
  }

  private parseEngagementFromDynamoDB(engagementMap: AWS.DynamoDB.DocumentClient.MapAttributeValue): EngagementPostDto {
    return {
      avgTimeOnPage: Number(engagementMap.avgTimeOnPage.N),
      socialShares: Number(engagementMap.socialShares.N),
      views: Number(engagementMap.views.N),
    } as EngagementPostDto;
  }

  private parseMediaFromDynamoDB(mediaMap: AWS.DynamoDB.DocumentClient.MapAttributeValue): MediaPostDto {
    return {
      images: (mediaMap.images.L || []).map(imageItem => this.parseImageFromDynamoDB(imageItem.M)),
      videos: (mediaMap.videos.L || []).map(videoItem => this.parseVideoFromDynamoDB(videoItem.M)),
    } as MediaPostDto;
  }

  private parseSeoFromDynamoDB(seoMap: AWS.DynamoDB.DocumentClient.MapAttributeValue): SeoPostDto {
    return {
      canonicalUrl: seoMap.canonicalUrl.S,
      keywords: (seoMap.keywords.L || []).map(keywordItem => keywordItem.S),
      metaDescription: seoMap.metaDescription.S,
      title: seoMap.title.S,
    } as SeoPostDto;
  }

  private parseSectionFromDynamoDB(sectionMap: AWS.DynamoDB.DocumentClient.MapAttributeValue): SectionPostDto {
    return {
      anchor: sectionMap.anchor.S,
      title: sectionMap.title.S,
      type: sectionMap.type.S,
    } as SectionPostDto;
  }

  private parseReferenceFromDynamoDB(refMap: AWS.DynamoDB.DocumentClient.MapAttributeValue): ReferencePostDto {
    return {
      author: refMap.author.S,
      title: refMap.title.S,
      url: refMap.url.S,
    } as ReferencePostDto;
  }

  private parseImageFromDynamoDB(imageMap: AWS.DynamoDB.DocumentClient.MapAttributeValue): ImagePostDto {
    return {
      alt: imageMap.alt.S,
      url: imageMap.url.S,
    } as ImagePostDto;
  }

  private parseVideoFromDynamoDB(videoMap: AWS.DynamoDB.DocumentClient.MapAttributeValue): VideoPostDto {
    return {
      embedUrl: videoMap.embedUrl.S,
      thumbnail: videoMap.thumbnail.S,
    } as VideoPostDto;
  }


  // Métodos auxiliares para converter DTOs de Create/Update para o formato DynamoDB (para objetos aninhados de Post)
  private convertContentDtoToDynamoDB(contentDto: CreateContentPostDto | UpdateContentPostDto): AWS.DynamoDB.DocumentClient.MapAttributeValue {
    return {
      M: {
        html: { S: contentDto.html },
        readingTime: { N: String(contentDto.readingTime) },
        sections: { L: (contentDto.sections || []).map(sectionDto => ({ M: this.convertSectionDtoToDynamoDB(sectionDto) })) },
        references: { L: (contentDto.references || []).map(refDto => ({ M: this.convertReferenceDtoToDynamoDB(refDto) })) },
      },
    };
  }

  private convertEngagementDtoToDynamoDB(engagementDto: CreateEngagementPostDto | UpdateEngagementPostDto): AWS.DynamoDB.DocumentClient.MapAttributeValue {
    return {
      M: {
        avgTimeOnPage: { N: String(engagementDto.avgTimeOnPage) },
        socialShares: { N: String(engagementDto.socialShares) },
        views: { N: String(engagementDto.views) },
      },
    };
  }

  private convertMediaDtoToDynamoDB(mediaDto: CreateMediaPostDto | UpdateMediaPostDto): AWS.DynamoDB.DocumentClient.MapAttributeValue {
    return {
      M: {
        images: { L: (mediaDto.images || []).map(imageDto => ({ M: this.convertImageDtoToDynamoDB(imageDto) })) },
        videos: { L: (mediaDto.videos || []).map(videoDto => ({ M: this.convertVideoDtoToDynamoDB(videoDto) })) },
      },
    };
  }

  private convertSeoDtoToDynamoDB(seoDto: CreateSeoPostDto | UpdateSeoPostDto): AWS.DynamoDB.DocumentClient.MapAttributeValue {
    return {
      M: {
        canonicalUrl: { S: seoDto.canonicalUrl },
        keywords: { L: seoDto.keywords.map(keyword => ({ S: keyword })) },
        metaDescription: { S: seoDto.metaDescription },
        title: { S: seoDto.title },
      },
    };
  }

  private convertSectionDtoToDynamoDB(sectionDto: CreateSectionPostDto | UpdateSectionPostDto): AWS.DynamoDB.DocumentClient.MapAttributeValue {
    return {
      anchor: { S: sectionDto.anchor },
      title: { S: sectionDto.title },
      type: { S: sectionDto.type },
    };
  }

  private convertReferenceDtoToDynamoDB(refDto: CreateReferencePostDto | UpdateReferencePostDto): AWS.DynamoDB.DocumentClient.MapAttributeValue {
    return {
      author: { S: refDto.author },
      title: { S: refDto.title },
      url: { S: refDto.url },
    };
  }

  private convertImageDtoToDynamoDB(imageDto: CreateImagePostDto | UpdateImagePostDto): AWS.DynamoDB.DocumentClient.MapAttributeValue {
    return {
      alt: { S: imageDto.alt },
      url: { S: imageDto.url },
    };
  }

  private convertVideoDtoToDynamoDB(videoDto: CreateVideoDto | UpdateVideoDto): AWS.DynamoDB.DocumentClient.MapAttributeValue {
    return {
      embedUrl: { S: videoDto.embedUrl },
      thumbnail: { S: videoDto.thumbnail },
    };
  }
}