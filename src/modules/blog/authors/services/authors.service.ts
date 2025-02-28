import { DynamoDbService } from '@src/services/dynamoDb.service';
import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { UpdateCommandInput } from '@aws-sdk/lib-dynamodb';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateAuthorDto } from '@src/modules/blog/authors/dto/Create-author.dto';
import { UpdateAuthorDto } from '@src/modules/blog/authors/dto/Update-author.dto';
import { AuthorDetailDto } from '@src/modules/blog/authors/dto/author-detail.dto';

/**
 * @Injectable()
 * Serviço responsável pela lógica de negócio da entidade Author (Autor).
 * Este serviço interage com o DynamoDB para realizar operações CRUD (Create, Read, Update, Delete)
 * na tabela 'Authors'.
 */
@Injectable()
export class AuthorsService {
    private readonly tableName = 'Authors'; // Nome da tabela DynamoDB para Autores
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
     *
     * @param createAuthorDto DTO contendo os dados para criar um novo autor.
     * @returns Uma Promise que resolve para um AuthorDetailDto representando o autor criado.
     */
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
     *
     * @returns Uma Promise que resolve para um array de AuthorDetailDto ou um objeto com mensagem caso não haja autores.
     */
    async findAll(): Promise<AuthorDetailDto[] | { message: string }> {
        this.logger.log('Buscando todos os autores.');
        const params = {
            TableName: this.tableName,
        };

        const result = await this.dynamoDbService.scan(params);

        this.logger.debug(`Dados brutos do DynamoDB: ${JSON.stringify(result.Items, null, 2)}`);

        if (!result.Items || result.Items.length === 0) {
            return { message: "Nenhum autor cadastrado." };
        }

        return result.Items.map(AuthorDetailDto.fromDynamoDB);
    }

    /**
     * Busca um autor específico pelo seu authorId no DynamoDB.
     *
     * @param authorId ID do autor a ser buscado.
     * @returns Uma Promise que resolve para um AuthorDetailDto, se o autor for encontrado.
     * @throws NotFoundException Se o autor não for encontrado.
     */
    async findOne(authorId: string): Promise<AuthorDetailDto> {
        this.logger.log(`Buscando autor com authorId: ${authorId}`);
        const params = {
            TableName: this.tableName,
            Key: { authorId },
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
     *
     * @param authorId ID do autor a ser atualizado.
     * @param updateAuthorDto DTO contendo os dados a serem atualizados do autor.
     * @returns Uma Promise que resolve para um AuthorDetailDto representando o autor atualizado.
     * @throws NotFoundException Se o autor não for encontrado.
     */
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
        return this.mapAuthorFromDynamoDb(result.Attributes as Record<string, any>);
    }

    /**
     * Remove um autor do DynamoDB pelo seu authorId.
     *
     * @param authorId ID do autor a ser removido.
     * @returns Uma Promise que resolve void (sem retorno), indicando sucesso na remoção.
     * @throws NotFoundException Se o autor não for encontrado.
     */
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
     *
     * @param item Item retornado do DynamoDB.
     * @returns Um AuthorDetailDto preenchido com os dados do item do DynamoDB.
     * @private
     */
    private mapAuthorFromDynamoDb(item: Record<string, any>): AuthorDetailDto {
        return {
            authorId: item.authorId?.S,
            name: item.name?.S,
            slug: item.slug?.S,
            expertise: item.expertise?.L?.map((expertiseItem: any) => expertiseItem.S) || [],
            socialProof: Object.entries(item.socialProof?.M || {}).reduce((obj: { [key: string]: string }, [key, value]: [string, any]) => {
                obj[key] = value?.S;
                return obj;
            }, {}) as { [key: string]: string } || {},
        } as AuthorDetailDto;
    }

    /**
   * Busca um autor pelo seu ID utilizando cache.
   *
   * Se o autor estiver armazenado no cache, retorna o valor armazenado;
   * caso contrário, consulta o DynamoDB, armazena o resultado em cache e retorna o autor encontrado.
   *
   * @param authorId - ID do autor a ser buscado.
   * @returns Uma Promise que resolve para um AuthorDetailDto representando o autor encontrado.
   * @throws NotFoundException Se o autor não for encontrado.
   */
    async getAuthorById(authorId: string): Promise<AuthorDetailDto> {
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
            Key: { authorId },
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
        await this.cacheManager.set(cacheKey, author, { ttl: 300 });

        return author;
    }




}
