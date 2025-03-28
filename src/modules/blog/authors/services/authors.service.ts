import { DynamoDbService } from '@src/services/dynamoDb.service';
import { Injectable, NotFoundException, Logger, Inject, BadRequestException, UseGuards } from '@nestjs/common';
import { UpdateCommandInput } from '@aws-sdk/lib-dynamodb';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateAuthorDto } from '@src/modules/blog/authors/dto/Create-author.dto';
import { UpdateAuthorDto } from '@src/modules/blog/authors/dto/Update-author.dto';
import { AuthorDetailDto } from '@src/modules/blog/authors/dto/author-detail.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CognitoAuthGuard } from '@src/auth/cognito-auth.guard';

/**
 * @AuthorsService
 * Serviço responsável pela lógica de negócio da entidade Author (Autor).
 * Este serviço interage com o DynamoDB para realizar operações CRUD (Create, Read, Update, Delete)
 * na tabela 'Authors'.
 */
@ApiTags('Authors')
@Injectable()
export class AuthorsService {
    private readonly tableName = 'Authors'; // Certifique-se de que o nome da tabela está correto
    private readonly logger = new Logger(AuthorsService.name); // Logger para registrar eventos e erros neste serviço

    /**
     * Injeta as dependências necessárias para interagir com o DynamoDB e gerenciar cache.
     *
     * @param dynamoDbService Serviço de acesso ao DynamoDB.
     * @param cacheManager Gerenciador de cache para armazenar dados em cache.
     * @constructor
     */
    constructor(
        private readonly dynamoDbService: DynamoDbService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    /**
     * Cria um novo autor no DynamoDB.
     * @param createAuthorDto DTO contendo os dados para criar um novo autor.
     * @returns Uma Promise que resolve para um AuthorDetailDto representando o autor criado.
     * @throws BadRequestException Se os dados forem inválidos.
     */
    @ApiOperation({ summary: 'Cria um novo autor' })
    @ApiResponse({ status: 201, description: 'Autor criado com sucesso.', type: AuthorDetailDto })
    @ApiResponse({ status: 400, description: 'Dados inválidos.' })
    async create(createAuthorDto: CreateAuthorDto): Promise<AuthorDetailDto> {
        this.logger.log(`Criando autor com authorId: ${createAuthorDto.authorId}`);
        const params = {
            TableName: this.tableName,
            Item: createAuthorDto,
        };
        await this.dynamoDbService.putItem(params);
        return this.findOne(createAuthorDto.authorId);
    }

    /**
     * Busca todos os autores no DynamoDB.
     * @returns Uma Promise que resolve para um array de AuthorDetailDto ou um objeto com mensagem caso não haja autores.
     */
    @UseGuards(CognitoAuthGuard)
    @ApiOperation({ summary: 'Busca todos os autores' })
    @ApiResponse({ status: 200, description: 'Lista de autores.', type: [AuthorDetailDto] })
    @ApiResponse({ status: 404, description: 'Nenhum autor encontrado.' })
    async findAll(): Promise<AuthorDetailDto[]> {
        this.logger.log('Buscando todos os autores.');
        const params = {
            TableName: this.tableName,
        };

        const result = await this.dynamoDbService.scan(params);

        this.logger.debug(`Dados brutos do DynamoDB: ${JSON.stringify(result.Items, null, 2)}`);

        if (!result.Items || result.Items.length === 0) {
            return [];
        }

        return result.Items.map(AuthorDetailDto.fromDynamoDB);
    }

    /**
     * Busca um autor específico pelo seu authorId no DynamoDB.
     * @param authorId ID do autor a ser buscado.
     * @returns Uma Promise que resolve para um AuthorDetailDto, se o autor for encontrado.
     * @throws NotFoundException Se o autor não for encontrado.
     */
    @ApiOperation({ summary: 'Busca um autor pelo ID' })
    @ApiResponse({ status: 200, description: 'Autor encontrado.', type: AuthorDetailDto })
    @ApiResponse({ status: 404, description: 'Autor não encontrado.' })
    async findOne(authorId: string): Promise<AuthorDetailDto> {
        this.logger.log(`Buscando autor com authorId: ${authorId}`);
        const params = {
            TableName: this.tableName,
            Key: { authorId: authorId },
        };

        const result = await this.dynamoDbService.getItem(params);

        if (!result.Item) {
            this.logger.warn(`Autor com authorId '${authorId}' não encontrado.`);
            throw new NotFoundException(`Autor com authorId '${authorId}' não encontrado`);
        }

        return AuthorDetailDto.fromDynamoDB(result.Item);
    }

    /**
     * Atualiza um autor existente no DynamoDB.
     * @param authorId ID do autor a ser atualizado.
     * @param updateAuthorDto DTO contendo os dados a serem atualizados do autor.
     * @returns Uma Promise que resolve para um AuthorDetailDto representando o autor atualizado.
     * @throws NotFoundException Se o autor não for encontrado.
     */
    @ApiOperation({ summary: 'Atualiza um autor pelo ID' })
    @ApiResponse({ status: 200, description: 'Autor atualizado com sucesso.', type: AuthorDetailDto })
    @ApiResponse({ status: 404, description: 'Autor não encontrado.' })
    async update(authorId: string, updateAuthorDto: UpdateAuthorDto): Promise<AuthorDetailDto> {
        this.logger.log(`Atualizando autor com authorId: ${authorId}`);
        // Verifica se o autor existe antes de atualizar
        await this.findOne(authorId);

        const updateExpression = this.dynamoDbService.buildUpdateExpression(updateAuthorDto);
        if (!updateExpression) {
            this.logger.warn(`Nenhum campo para atualizar fornecido para authorId: ${authorId}. Retornando autor existente.`);
            return this.findOne(authorId);
        }

        const params: UpdateCommandInput = {
            TableName: this.tableName,
            Key: { authorId },
            ...updateExpression,
            ReturnValues: 'ALL_NEW',
        };

        const result = await this.dynamoDbService.updateItem(params);
        return this.mapAuthorFromDynamoDb(result.Attributes as Record<string, unknown>);
    }

    /**
     * Remove um autor do DynamoDB pelo seu authorId.
     * @param authorId ID do autor a ser removido.
     * @returns Uma Promise que resolve void (sem retorno), indicando sucesso na remoção.
     * @throws NotFoundException Se o autor não for encontrado.
     */
    @ApiOperation({ summary: 'Remove um autor pelo ID' })
    @ApiResponse({ status: 200, description: 'Autor removido com sucesso.' })
    @ApiResponse({ status: 404, description: 'Autor não encontrado.' })
    async remove(authorId: string): Promise<void> {
        this.logger.log(`Removendo autor com authorId: ${authorId}`);
        // Verifica se o autor existe antes de deletar
        await this.findOne(authorId);

        const params = {
            TableName: this.tableName,
            Key: { authorId },
        };
        await this.dynamoDbService.deleteItem(params);
    }

    /**
     * Mapeia um item retornado do DynamoDB para um AuthorDetailDto.
     * Converte o formato de dados do DynamoDB para o formato AuthorDetailDto da aplicação.
     * @param item Item retornado do DynamoDB.
     * @returns Um AuthorDetailDto preenchido com os dados do item do DynamoDB.
     * @private
     */
    private mapAuthorFromDynamoDb(item: Record<string, unknown>): AuthorDetailDto {
        return {
            authorId: item.authorId as string,
            name: item.name as string,
            slug: item.slug as string,
            expertise: Array.isArray(item.expertise)
                ? (item.expertise as unknown[]).map((expertiseItem) => String(expertiseItem))
                : [],
            socialProof: Object.entries(item.socialProof || {}).reduce((obj: { [key: string]: string }, [key, value]: [string, unknown]) => {
                obj[key] = String(value);
                return obj;
            }, {} as { [key: string]: string }),
        } as AuthorDetailDto;
    }

    /**
     * Busca um autor pelo seu ID utilizando cache.
     * @param authorId - ID do autor a ser buscado.
     * @returns Uma Promise que resolve para um AuthorDetailDto representando o autor encontrado.
     * @throws NotFoundException Se o autor não for encontrado.
     */
    @ApiOperation({ summary: 'Busca um autor pelo ID utilizando cache' })
    @ApiResponse({ status: 200, description: 'Autor encontrado.', type: AuthorDetailDto })
    @ApiResponse({ status: 404, description: 'Autor não encontrado.' })
    async getAuthorById(authorId: string): Promise<AuthorDetailDto> {
        if (!authorId) {
            throw new BadRequestException('authorId não fornecido');
        }
        this.logger.log(`Buscando autor com authorId: ${authorId}`);

        // Tenta recuperar o autor do cache utilizando uma chave única
        const cacheKey = `author_${authorId}`;
        const cached = await this.cacheManager.get<AuthorDetailDto>(cacheKey);
        if (cached) {
            return cached;
        }

        // Define os parâmetros para consulta no DynamoDB
        const params = {
            TableName: this.tableName,
            Key: {
                authorId: authorId,
            },
        };

        // Consulta o DynamoDB pelo autor
        const result = await this.dynamoDbService.getItem(params);
        if (!result.Item) {
            this.logger.warn(`Autor com authorId ${authorId} não encontrado.`);
            throw new NotFoundException(`Autor com authorId ${authorId} não encontrado.`);
        }

        // Mapeia o item retornado do DynamoDB para o DTO
        const author = this.mapAuthorFromDynamoDb(result.Item);

        // Armazena o autor em cache com TTL de 5 minutos (300 segundos)
        await this.cacheManager.set(cacheKey, author, 300);

        return author;
    }
}
