//src/modules/blog/posts/services/posts.service.ts


import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common'; // Importe Logger
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PostDto } from '../dto/post.dto';
import { AuthorDto } from '@src/modules/blog/authors/dto/author.dto'; // Importe AuthorDto  (Corrected import - was importing PostDto again by mistake)
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { v4 as uuidv4 } from 'uuid';
import { GetCommandInput, ScanCommandInput, PutCommandInput, UpdateCommandInput, DeleteCommandInput } from '@aws-sdk/lib-dynamodb';
import { AuthorsService } from '@src/modules/blog/authors/services/authors.service'; // Import AuthorsService - Make sure the path is correct

/**
 * @Injectable()
 * @description Service responsible for managing blog posts.
 * Handles CRUD operations for posts and interactions with DynamoDB.
 * Utilizes DynamoDbService for database operations and AuthorsService for author related data.
 */
@Injectable()
export class PostsService {
  private tableName = 'Posts'; // Define the DynamoDB table name for posts
  private readonly logger = new Logger(PostsService.name); // Logger for PostsService class

  /**
   * @constructor
   * @param {DynamoDbService} dynamoDbService - Service for interacting with DynamoDB.
   * @param {AuthorsService} authorsService - Service for managing authors.
   * @description Injects DynamoDbService and AuthorsService into the PostsService.
   */
  constructor(
    private readonly dynamoDbService: DynamoDbService,
    private readonly authorsService: AuthorsService // Inject AuthorsService to fetch author information

  ) { }

  /**
   * @async
   * @method createPost
   * @param {string} categoryIdSubcategoryId - Composite key for category and subcategory.
   * @param {CreatePostDto} createPostDto - Data transfer object for creating a post.
   * @returns {Promise<PostDto>} - Promise resolving to the created PostDto.
   * @description Creates a new post in DynamoDB.
   * Generates a unique postId using UUID and stores the post data in the Posts table.
   * After successful creation, it retrieves and returns the newly created post.
   */
  async createPost(categoryIdSubcategoryId: string, createPostDto: CreatePostDto): Promise<PostDto> {
    // Logger statement (commented out as per instruction to not add logs here for now)
    // this.logger.log(`Creating post in category/subcategory: ${categoryIdSubcategoryId}`);

    const postId = uuidv4(); // Generate a unique postId using UUID v4
    const params: PutCommandInput = {
      TableName: this.tableName, // Table name for posts
      Item: { // Item to be put into DynamoDB
        'categoryId#subcategoryId': categoryIdSubcategoryId, // Partition key (composite category and subcategory)
        postId: postId, // Sort key (unique post identifier)
        categoryId: createPostDto.categoryId, // Category ID
        subcategoryId: createPostDto.subcategoryId, // Subcategory ID
        contentHTML: createPostDto.contentHTML, // HTML content of the post
        postInfo: createPostDto.postInfo, // Additional post information (authorId, tags, etc.)
        seo: createPostDto.seo, // SEO related information for the post
      },
    };

    await this.dynamoDbService.putItem(params); // Put the new item into DynamoDB
    return this.getPostById(categoryIdSubcategoryId, postId); // Retrieve and return the created post
  }

  /**
   * @async
   * @method getAllPosts
   * @returns {Promise<PostDto[]>} - Promise resolving to an array of PostDto.
   * @description Retrieves all posts from DynamoDB.
   * Scans the Posts table to retrieve all items. This operation might be inefficient for large tables.
   * It then maps each DynamoDB item to a PostDto and returns the array of posts.
   */
  async getAllPosts(): Promise<PostDto[]> {
    // Logger statement (commented out as per instruction to not add logs here for now)
    // this.logger.log('Retrieving all posts');

    const params: ScanCommandInput = {
      TableName: this.tableName, // Table name for posts
    };

    const result = await this.dynamoDbService.scan(params); // Scan the DynamoDB table to get all items
    const items = result.Items; // Extract items from the scan result

    if (!items || items.length === 0) {
      return []; // Return an empty array if no posts are found
    }

    return items.map(item => this.mapDynamoItemToPostDto(item)) as PostDto[]; // Map DynamoDB items to PostDto array
  }

  /**
   * @async
   * @method getPostById
   * @param {string} categoryIdSubcategoryId - Composite key for category and subcategory.
   * @param {string} postId - Unique identifier for the post.
   * @returns {Promise<PostDto>} - Promise resolving to the PostDto if found.
   * @throws {NotFoundException} - Throws if the post is not found.
   * @description Retrieves a specific post from DynamoDB by its categoryIdSubcategoryId and postId.
   * It fetches the item using GetCommand and then maps the DynamoDB item to a PostDto.
   * Optionally, it also fetches and adds the author's name to the PostDto using AuthorsService.
   */
  async getPostById(categoryIdSubcategoryId: string, postId: string): Promise<PostDto> {
    this.logger.log(`getPostById: Iniciando busca do post. categoryIdSubcategoryId: ${categoryIdSubcategoryId}, postId: ${postId}`); // LOG 1: Log when starting to fetch post with params
    const params: GetCommandInput = {
      TableName: this.tableName, // Table name for posts
      Key: { // Key to identify the post in DynamoDB
        'categoryId#subcategoryId': categoryIdSubcategoryId, // Partition key
        postId: postId, // Sort key
      },
    };
    this.logger.log(`getPostById: Parametros para DynamoDB: ${JSON.stringify(params)}`); // LOG 2: Log DynamoDB parameters

    const result = await this.dynamoDbService.getItem(params); // Fetch item from DynamoDB
    this.logger.log(`getPostById: Resultado bruto do DynamoDB: ${JSON.stringify(result)}`); // LOG 3: Log raw DynamoDB result
    const item = result.Item; // Extract the Item from the result
    this.logger.log(`getPostById: Item do DynamoDB (result.Item): ${JSON.stringify(item)}`); // LOG 4: Log the extracted DynamoDB item

    if (!item) {
      this.logger.warn(`getPostById: Post não encontrado no DynamoDB. categoryIdSubcategoryId: ${categoryIdSubcategoryId}, postId: ${postId}`); // LOG 5: Log warning if post not found
      throw new NotFoundException(`Post com ID '${postId}' na categoria '${categoryIdSubcategoryId}' não encontrado`); // Throw NotFoundException if post is not found
    }

    const postDto = this.mapDynamoItemToPostDto(item); // Map DynamoDB item to PostDto
    this.logger.log(`getPostById: PostDto mapeado: ${JSON.stringify(postDto)}`); // LOG 6: Log the mapped PostDto

    // Buscar e adicionar o nome do autor (Fetch and add author name)
    if (postDto.postInfo && postDto.postInfo.authorId) {
      try {
        const authorDto = await this.authorsService.getAuthorById(postDto.postInfo.authorId); // Fetch author info using AuthorsService
        postDto.postInfo.authorName = authorDto.name; // Add author's name to the PostDto
        this.logger.log(`getPostById: Nome do autor '${authorDto.name}' adicionado ao PostDto.`); // Log author name addition success
      } catch (error) {
        this.logger.warn(`getPostById: Autor com id '${postDto.postInfo.authorId}' não encontrado, mesmo que o post exista. Erro: ${error.message}`); // Log warning if author not found
        // Do not throw error, just log and proceed without author name (optional, based on requirement)
      }
    }

    return postDto; // Return the PostDto
  }

  /**
   * @async
   * @method updatePost
   * @param {string} categoryIdSubcategoryId - Composite key for category and subcategory.
   * @param {string} postId - Unique identifier for the post.
   * @param {UpdatePostDto} updatePostDto - Data transfer object for updating a post.
   * @returns {Promise<PostDto>} - Promise resolving to the updated PostDto.
   * @throws {NotFoundException} - Throws if the post to update is not found.
   * @description Updates an existing post in DynamoDB.
   * It first checks if the post exists, then builds an update expression using DynamoDbService,
   * and updates the item in DynamoDB. Finally, it retrieves and returns the updated PostDto.
   */
  async updatePost(categoryIdSubcategoryId: string, postId: string, updatePostDto: UpdatePostDto): Promise<PostDto> {
    // Logger statement (commented out as per instruction to not add logs here for now)
    // this.logger.log(`Updating post with ID: ${postId}`);

    await this.getPostById(categoryIdSubcategoryId, postId); // Verify if the post exists, throws NotFoundException if not

    const updateExpression = this.dynamoDbService.buildUpdateExpression(updatePostDto); // Build update expression dynamically

    if (!updateExpression) {
      return this.getPostById(categoryIdSubcategoryId, postId); // If no attributes to update, return current post
    }

    const params: UpdateCommandInput = {
      TableName: this.tableName, // Table name for posts
      Key: { // Key to identify the post for update
        'categoryId#subcategoryId': categoryIdSubcategoryId, // Partition key
        postId: postId, // Sort key
      },
      ...updateExpression, // Spread the update expression
      ExpressionAttributeValues: { // Define values for the expression attributes
        ...updateExpression.ExpressionAttributeValues, // Include existing expression attribute values
        ':categoryId': updatePostDto.categoryId, // Set categoryId in expression values
        ':subcategoryId': updatePostDto.subcategoryId, // Set subcategoryId in expression values
      },
      ReturnValues: 'ALL_NEW', // Return all attributes of the item as they appear after the update
    };


    const result = await this.dynamoDbService.updateItem(params); // Update item in DynamoDB
    return this.mapDynamoItemToPostDto(result.Attributes as any) as PostDto; // Map updated DynamoDB item to PostDto
  }

  /**
   * @async
   * @method deletePost
   * @param {string} categoryIdSubcategoryId - Composite key for category and subcategory.
   * @param {string} postId - Unique identifier for the post.
   * @returns {Promise<void>} - Promise resolving to void after successful deletion.
   * @throws {NotFoundException} - Throws if the post to delete is not found.
   * @description Deletes a post from DynamoDB.
   * It first checks if the post exists, and if found, proceeds to delete it using DeleteCommand.
   */
  async deletePost(categoryIdSubcategoryId: string, postId: string): Promise<void> {
    // Logger statement (commented out as per instruction to not add logs here for now)
    // this.logger.log(`Deleting post with ID: ${postId}`);

    await this.getPostById(categoryIdSubcategoryId, postId); // Verify if the post exists, throws NotFoundException if not

    const params: DeleteCommandInput = {
      TableName: this.tableName, // Table name for posts
      Key: { // Key to identify the post for deletion
        'categoryId#subcategoryId': categoryIdSubcategoryId, // Partition key
        postId: postId, // Sort key
      },
    };

    await this.dynamoDbService.deleteItem(params); // Delete item from DynamoDB
  }

  /**
   * @private
   * @method mapDynamoItemToPostDto
   * @param {any} item - DynamoDB item object.
   * @returns {PostDto} - PostDto mapped from the DynamoDB item.
   * @description Maps a DynamoDB item to a PostDto.
   * This utility function handles the conversion of DynamoDB attribute types to Javascript types,
   * especially for nested attributes like postInfo and seo which are Maps in DynamoDB.
   * It includes error handling and logging to ensure robustness during data mapping.
   */
  private mapDynamoItemToPostDto(item: any): PostDto {
    this.logger.log(`mapDynamoItemToPostDto: Item recebido para mapeamento: ${JSON.stringify(item)}`); // LOG 7: Log item received for mapping
    if (!item) {
      this.logger.warn('mapDynamoItemToPostDto: Item é undefined/null, retornando undefined'); // LOG 8: Log warning if item is undefined/null
      return undefined; // Return undefined if item is null or undefined
    }
    try { // Try block to catch potential errors during mapping
      const postDto: PostDto = {
        'categoryId#subcategoryId': item['categoryId#subcategoryId']?.S, // Map categoryId#subcategoryId (String)
        postId: item.postId?.S, // Map postId (String)
        categoryId: item.categoryId?.S, // Map categoryId (String)
        subcategoryId: item.subcategoryId?.S, // Map subcategoryId (String)
        contentHTML: item.contentHTML?.S, // Map contentHTML (String)
        postInfo: item.postInfo?.M ? { // Map postInfo (Map) if it exists
          authorId: item.postInfo?.M.authorId?.S, // Map authorId within postInfo (String)
          tags: item.postInfo?.M.tags?.SS ? Array.from(item.postInfo?.M.tags?.SS) : [], // Map tags within postInfo (String Set to Array)
          excerpt: item.postInfo?.M.excerpt?.S, // Map excerpt within postInfo (String)
          featuredImageURL: item.postInfo?.M.featuredImageURL?.S, // Map featuredImageURL within postInfo (String)
          modifiedDate: item.postInfo?.M.modifiedDate?.S, // Map modifiedDate within postInfo (String)
          publishDate: item.postInfo?.M.publishDate?.S, // Map publishDate within postInfo (String)
          readingTime: Number(item.postInfo?.M.readingTime?.N), // Map readingTime within postInfo (Number)
          slug: item.postInfo?.M.slug?.S, // Map slug within postInfo (String)
          status: item.postInfo?.M.status?.S, // Map status within postInfo (String)
          title: item.postInfo?.M.title?.S, // Map title within postInfo (String)
          views: Number(item.postInfo?.M.views?.N), // Map views within postInfo (Number)
        } : undefined, // If postInfo is not a Map, set to undefined
        seo: item.seo?.M ? { // Map seo (Map) if it exists
          canonical: item.seo?.M.canonical?.S, // Map canonical within seo (String)
          description: item.seo?.M.description?.S, // Map description within seo (String)
          keywords: item.seo?.M.keywords?.SS ? Array.from(item.seo?.M.keywords?.SS) : [], // Map keywords within seo (String Set to Array)
        } : undefined, // If seo is not a Map, set to undefined
      } as PostDto;
      this.logger.log(`mapDynamoItemToPostDto: PostDto mapeado com sucesso: ${JSON.stringify(postDto)}`); // LOG 9: Log successful PostDto mapping
      return postDto; // Return the mapped PostDto
    } catch (error) {
      this.logger.error(`mapDynamoItemToPostDto: Erro durante o mapeamento: ${error.message}`, error.stack); // LOG 10: Log error during mapping
      return undefined; // Return undefined in case of mapping error
    }
  }
}