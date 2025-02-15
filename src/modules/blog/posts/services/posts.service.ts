import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PostDto } from '../dto/post.dto';
import { v4 as uuidv4 } from 'uuid';
import { AuthorsService } from '../../authors/services/authors.service'; // Importe AuthorsService
import { CommentsService } from '../../comments/services/comments.service'; // Importe CommentsService
import { FullPostDto } from '../dto/full-post.dto'; // Importe FullPostDto

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private readonly tableName = 'Posts';

  constructor(
    private readonly dynamoDbService: DynamoDbService,
    private readonly authorsService: AuthorsService, // Injeta AuthorsService
    private readonly commentsService: CommentsService, // Injeta CommentsService
  ) { }

  async createPost(categoryIdSubcategoryId: string, createPostDto: CreatePostDto): Promise<PostDto> {
    const postId = uuidv4();
    const params = {
      TableName: this.tableName,
      Item: {
        ...createPostDto,
        postId,
        categoryIdSubcategoryId, // Certifique-se de que categoryIdSubcategoryId está sendo passado corretamente
      },
    };
    await this.dynamoDbService.putItem(params);
    return this.getPostById(categoryIdSubcategoryId, postId);
  }

  async getAllPosts(categoryIdSubcategoryId?: string): Promise<PostDto[]> { // Modifiquei para aceitar categoryIdSubcategoryId opcional
    const params: any = { // Removi a tipagem ScanCommandInput para simplificar
      TableName: this.tableName,
    };
    if (categoryIdSubcategoryId) { // Se categoryIdSubcategoryId for fornecido, filtra por ele
      params.FilterExpression = 'begins_with(categoryId#subcategoryId, :categorySubKey)';
      params.ExpressionAttributeValues = { ':categorySubKey': categoryIdSubcategoryId };
    }

    const result = await this.dynamoDbService.scan(params);
    return (result.Items || []).map(item => this.mapDynamoItemToPostDto(item));
  }


  async getPostById(categoryIdSubcategoryId: string, postId: string): Promise<PostDto> {
    this.logger.log(`getPostById: Iniciando busca do post com ID ${postId} e categoryIdSubcategoryId ${categoryIdSubcategoryId}...`); // Log no início
    const params = {
      TableName: this.tableName,
      Key: {
        'categoryId#subcategoryId': categoryIdSubcategoryId,
        postId: postId,
      },
    };
    this.logger.log(`getPostById: Parametros para DynamoDB: ${JSON.stringify(params)}`); // Log dos parâmetros

    try {
      const result = await this.dynamoDbService.getItem(params);
      this.logger.log(`getPostById: Resultado bruto do DynamoDB: ${JSON.stringify(result)}`); // Log do resultado bruto
      const item = result.Item;

      if (!item) {
        this.logger.log(`getPostById: Item não encontrado para postId ${postId} e categoryIdSubcategoryId ${categoryIdSubcategoryId}`); // Log se item não encontrado
        throw new NotFoundException(`Post com ID '${postId}' não encontrado na categoria/subcategoria '${categoryIdSubcategoryId}'`);
      }
      this.logger.log(`getPostById: Item do DynamoDB (result.Item): ${JSON.stringify(item)}`); // Log do item

      const postDto = this.mapDynamoItemToPostDto(item);
      this.logger.log(`getPostById: PostDto mapeado: ${JSON.stringify(postDto)}`); // Log do PostDto

      return postDto;
    } catch (error) {
      this.logger.error(`Erro ao buscar post ${postId}:`, error); // Log de erro detalhado
      throw error;
    }
  }

  async getFullPostById(categoryIdSubcategoryId: string, postId: string): Promise<FullPostDto> {
    const postDto = await this.getPostById(categoryIdSubcategoryId, postId);
    const fullPostDto = new FullPostDto();
    Object.assign(fullPostDto, postDto); // Copia as propriedades de postDto para fullPostDto

    if (fullPostDto.postInfo && fullPostDto.postInfo.authorId) {
      try {
        fullPostDto.author = await this.authorsService.getAuthorById(fullPostDto.postInfo.authorId); // Busca autor por authorId (AuthorsService já deve estar ajustado)
      } catch (authorError) {
        this.logger.error(`Erro ao buscar autor do post ${postId}:`, authorError);
        fullPostDto.author = null; // Define author como null em caso de erro ao buscar autor, ou trate de outra forma
      }
    }

    try {
      fullPostDto.comments = await this.commentsService.getCommentsByPostId(postId); // Busca comentários por postId
    } catch (commentsError) {
      this.logger.error(`Erro ao buscar comentários do post ${postId}:`, commentsError);
      fullPostDto.comments = []; // Define comments como array vazio em caso de erro, ou trate de outra forma
    }

    return fullPostDto;
  }


  async updatePost(categoryIdSubcategoryId: string, postId: string, updatePostDto: UpdatePostDto): Promise<PostDto> {
    await this.getPostById(categoryIdSubcategoryId, postId); // Verifica se o post existe
    const updateExpression = this.dynamoDbService.buildUpdateExpression(updatePostDto);
    if (!updateExpression) {
      return this.getPostById(categoryIdSubcategoryId, postId); // Se não houver campos para atualizar, retorna o post existente
    }

    const params: any = { // Removi a tipagem UpdateCommandInput para simplificar
      TableName: this.tableName,
      Key: {
        'categoryId#subcategoryId': categoryIdSubcategoryId,
        postId: postId,
      },
      ...updateExpression,
      ReturnValues: 'ALL_NEW',
    };

    const result = await this.dynamoDbService.updateItem(params);
    return this.mapDynamoItemToPostDto(result.Attributes as Record<string, any>) as PostDto;
  }

  async deletePost(categoryIdSubcategoryId: string, postId: string): Promise<void> {
    await this.getPostById(categoryIdSubcategoryId, postId); // Verifica se o post existe
    const params = {
      TableName: this.tableName,
      Key: {
        'categoryId#subcategoryId': categoryIdSubcategoryId,
        postId: postId,
      },
    };
    await this.dynamoDbService.deleteItem(params);
  }

  private mapDynamoItemToPostDto(item: Record<string, any>): PostDto {
    return {
      categoryIdSubcategoryId: item['categoryId#subcategoryId']?.S,
      postId: item.postId?.S,
      categoryId: item.categoryId?.S,
      subcategoryId: item.subcategoryId?.S,
      postInfo: {
        title: item.postInfo?.M?.title?.S,
        slug: item.postInfo?.M?.slug?.S,
        excerpt: item.postInfo?.M?.excerpt?.S,
        contentHTML: item.postInfo?.M?.contentHTML?.S,
        authorId: item.postInfo?.M?.authorId?.S,
        publishDate: item.postInfo?.M?.publishDate?.S,
        modifiedDate: item.postInfo?.M?.modifiedDate?.S,
        featuredImageURL: item.postInfo?.M?.featuredImageURL?.S,
        status: item.postInfo?.M?.status?.S,
        tags: item.postInfo?.M?.tags?.SS,
        views: item.postInfo?.M?.views?.N ? Number(item.postInfo.M.views.N) : 0,
        readingTime: item.postInfo?.M?.readingTime?.N ? Number(item.postInfo.M.readingTime.N) : 0,
      },
      seo: {
        canonical: item.seo?.M?.canonical?.S,
        description: item.seo?.M?.description?.S,
        keywords: item.seo?.M?.keywords?.SS,
      }
    } as PostDto;
  }
}