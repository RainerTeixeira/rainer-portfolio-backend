import {
    Injectable,
    NotFoundException,
    Logger,
    Inject,
    BadRequestException,
    InternalServerErrorException, // Pode ser útil
    UseGuards // Se estiver usando guards
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'; // Para documentação Swagger

// --- Assumindo que seus DTOs estão nesses caminhos ---
import { CreateAuthorDto } from '@src/modules/blog/authors/dto/create-author.dto';
import { UpdateAuthorDto } from '@src/modules/blog/authors/dto/update-author.dto';
import { AuthorDetailDto } from '@src/modules/blog/authors/dto/author-detail.dto';
// -----------------------------------------------------

// --- Importe o serviço DynamoDB e o Erro personalizado ---
import { DynamoDbService, DynamoDBOperationError } from '@src/services/dynamoDb.service';
// -----------------------------------------------------

// Se estiver usando autenticação
import { CognitoAuthGuard } from '@src/auth/cognito-auth.guard';


/**
 * @ApiTags Authors
 * @Injectable
 * @Service AuthorsService
 * @description
 * Serviço responsável pela lógica de negócio relacionada aos Autores (Authors).
 * Interage com o DynamoDbService para operações CRUD na tabela 'Authors'
 * e utiliza cache para otimizar leituras frequentes.
 */
@ApiTags('Authors') // Agrupa endpoints relacionados a autores no Swagger
@Injectable()
export class AuthorsService {
    // Nome da tabela DynamoDB para autores. Mova para config se preferir.
    private readonly tableName = process.env.DYNAMO_TABLE_NAME_AUTHORS || 'Authors';
    private readonly logger = new Logger(AuthorsService.name);
    // TTL (Time To Live) padrão para itens no cache (em segundos)
    private readonly cacheTtl = 300; // 5 minutos

    /**
     * Construtor que injeta as dependências necessárias.
     * @param dynamoDbService - Serviço para interagir com o DynamoDB.
     * @param cacheManager - Gerenciador de cache (provido pelo @nestjs/cache-manager).
     */
    constructor(
        private readonly dynamoDbService: DynamoDbService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {
        this.logger.log(`Serviço AuthorsService inicializado. Tabela: ${this.tableName}`);
    }

    /**
     * @ApiOperation Cria um novo autor.
     * @ApiResponse Status 201: Autor criado com sucesso. Retorna o AuthorDetailDto.
     * @ApiResponse Status 400: Dados inválidos fornecidos no DTO.
     * @ApiResponse Status 500: Erro interno ao interagir com o DynamoDB.
     * @param createAuthorDto - DTO com os dados para a criação do autor.
     * @returns Promise<AuthorDetailDto> - O autor recém-criado.
     * @throws {BadRequestException} Se o DTO for inválido (validação do NestJS deve tratar isso).
     * @throws {InternalServerErrorException} Se ocorrer um erro no DynamoDB.
     */
    @ApiOperation({ summary: 'Cria um novo autor' })
    @ApiResponse({ status: 201, description: 'Autor criado com sucesso.', type: AuthorDetailDto })
    @ApiResponse({ status: 400, description: 'Dados inválidos fornecidos.' })
    @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
    async create(createAuthorDto: CreateAuthorDto): Promise<AuthorDetailDto> {
        this.logger.log(`Tentando criar autor com ID: ${createAuthorDto.authorId}`);

        // O DTO já deve vir validado pelo ValidationPipe do NestJS
        // Adicione validações extras aqui se necessário

        const params = {
            TableName: this.tableName,
            Item: createAuthorDto, // Passa o DTO diretamente (DocumentClient lida com a conversão)
            // ConditionExpression: 'attribute_not_exists(authorId)' // Opcional: Evita sobrescrever
        };

        try {
            await this.dynamoDbService.putItem(params);
            this.logger.log(`Autor ${createAuthorDto.authorId} criado com sucesso.`);
            // Após criar, busca o autor recém-criado para retornar o DTO completo
            // ou pode mapear diretamente `createAuthorDto` se ele já tiver todos os campos necessários.
            // Buscar garante que estamos retornando o que de fato foi salvo.
            // Limpa o cache de lista de autores (se houver)
            await this.clearAuthorsListCache();
            return this.findOne(createAuthorDto.authorId);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Erro ao criar autor ${createAuthorDto.authorId}: ${errorMessage}`, errorStack);
            if (error instanceof DynamoDBOperationError && error.originalError && (error.originalError as any).name === 'ConditionalCheckFailedException') {
                throw new BadRequestException(`Autor com ID '${createAuthorDto.authorId}' já existe.`);
            }
            throw new InternalServerErrorException('Falha ao criar o autor no banco de dados.');
        }
    }

    /**
     * @ApiOperation Busca todos os autores cadastrados.
     * @ApiResponse Status 200: Lista de autores retornada com sucesso.
     * @ApiResponse Status 500: Erro interno ao buscar autores.
     * @returns Promise<AuthorDetailDto[]> - Um array com todos os autores. Retorna array vazio se não houver autores.
     */
    @ApiOperation({ summary: 'Busca todos os autores' })
    @ApiResponse({ status: 200, description: 'Lista de autores.', type: [AuthorDetailDto] })
    @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
    // @UseGuards(CognitoAuthGuard) // Descomente se esta rota precisar de autenticação
    async findAll(): Promise<AuthorDetailDto[]> {
        this.logger.log('Buscando todos os autores...');
        const cacheKey = `authors_all`; // Chave para cache da lista completa

        try {
            // Tenta buscar do cache primeiro
            const cachedAuthors = await this.cacheManager.get<AuthorDetailDto[]>(cacheKey);
            if (cachedAuthors) {
                this.logger.log(`Retornando ${cachedAuthors.length} autores do cache.`);
                return cachedAuthors;
            }

            // Se não está no cache, busca no DynamoDB
            const params = { TableName: this.tableName };
            const result = await this.dynamoDbService.scan(params); // Use Scan com cautela!

            if (!result.Items || result.Items.length === 0) {
                this.logger.log('Nenhum autor encontrado no banco de dados.');
                return [];
            }

            this.logger.log(`Encontrados ${result.Items.length} autores no DynamoDB.`);
            // Mapeia os itens crus do DynamoDB para AuthorDetailDto
            // Assumindo que AuthorDetailDto.fromDynamoDB existe
            const authors = result.Items.map(item => AuthorDetailDto.fromDynamoDB(item as Record<string, any>)).filter(Boolean) as AuthorDetailDto[];

            // Salva no cache antes de retornar
            await this.cacheManager.set(cacheKey, authors, this.cacheTtl);
            this.logger.log(`Lista de autores salva no cache com TTL ${this.cacheTtl}s.`);

            return authors;
        } catch (error) {
            this.logger.error(`Erro ao buscar todos os autores: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, error instanceof Error ? error.stack : undefined);
            throw new InternalServerErrorException('Falha ao buscar a lista de autores.');
        }
    }

    /**
     * @ApiOperation Busca um autor específico pelo seu ID.
     * @ApiResponse Status 200: Autor encontrado e retornado.
     * @ApiResponse Status 400: ID do autor inválido ou não fornecido.
     * @ApiResponse Status 404: Autor não encontrado com o ID fornecido.
     * @ApiResponse Status 500: Erro interno ao buscar o autor.
     * @param authorId - O ID único do autor a ser buscado.
     * @returns Promise<AuthorDetailDto> - O DTO detalhado do autor encontrado.
     * @throws {BadRequestException} Se authorId for inválido.
     * @throws {NotFoundException} Se o autor não for encontrado.
     * @throws {InternalServerErrorException} Se ocorrer um erro no DynamoDB.
     */
    @ApiOperation({ summary: 'Busca um autor pelo ID' })
    @ApiResponse({ status: 200, description: 'Autor encontrado.', type: AuthorDetailDto })
    @ApiResponse({ status: 400, description: 'ID do autor inválido.' })
    @ApiResponse({ status: 404, description: 'Autor não encontrado.' })
    @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
    async findOne(authorId: string): Promise<AuthorDetailDto> {
        if (!authorId || typeof authorId !== 'string' || authorId.trim() === '') {
            throw new BadRequestException('O ID do autor deve ser uma string não vazia.');
        }
        this.logger.log(`Buscando autor com ID: ${authorId}`);
        // Usa o método com cache para buscar
        return this.getAuthorById(authorId);
    }

    /**
     * @ApiOperation Atualiza os dados de um autor existente.
     * @ApiResponse Status 200: Autor atualizado com sucesso. Retorna o DTO atualizado.
     * @ApiResponse Status 400: ID inválido ou nenhum dado fornecido para atualização.
     * @ApiResponse Status 404: Autor não encontrado para atualizar.
     * @ApiResponse Status 500: Erro interno ao atualizar o autor.
     * @param authorId - O ID do autor a ser atualizado.
     * @param updateAuthorDto - DTO com os campos a serem atualizados. Campos não presentes não serão alterados.
     * @returns Promise<AuthorDetailDto> - O DTO do autor com os dados atualizados.
     * @throws {BadRequestException} Se ID ou DTO forem inválidos.
     * @throws {NotFoundException} Se o autor não existir.
     * @throws {InternalServerErrorException} Se ocorrer erro no DynamoDB.
     */
    @ApiOperation({ summary: 'Atualiza um autor pelo ID' })
    @ApiResponse({ status: 200, description: 'Autor atualizado com sucesso.', type: AuthorDetailDto })
    @ApiResponse({ status: 400, description: 'Dados inválidos ou ID não fornecido.' })
    @ApiResponse({ status: 404, description: 'Autor não encontrado.' })
    @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
    // @UseGuards(CognitoAuthGuard) // Descomente se precisar de autenticação
    async update(authorId: string, updateAuthorDto: UpdateAuthorDto): Promise<AuthorDetailDto> {
        if (!authorId || typeof authorId !== 'string' || authorId.trim() === '') {
            throw new BadRequestException('O ID do autor deve ser uma string não vazia.');
        }
        // Verifica se há dados para atualizar
        if (!updateAuthorDto || Object.keys(updateAuthorDto).length === 0) {
            throw new BadRequestException('Nenhum dado fornecido para atualização.');
        }

        this.logger.log(`Tentando atualizar autor com ID: ${authorId}`);
        this.logger.debug(`Dados para atualização: ${JSON.stringify(updateAuthorDto)}`);

        // 1. Garante que o autor existe antes de tentar atualizar
        await this.findOne(authorId); // findOne já lida com NotFoundException e cache

        try {
            // 2. Chama o updateItem do DynamoDbService
            // O terceiro argumento (updateData) é o DTO com os campos a serem atualizados.
            // O DynamoDbService construirá a UpdateExpression.
            const result = await this.dynamoDbService.updateItem(
                this.tableName,
                { authorId }, // A chave primária
                updateAuthorDto, // Os dados a serem atualizados
                'ALL_NEW', // Retorna todos os atributos do item como ele ficou *após* a atualização
            );

            // 3. Verifica se a atualização retornou os atributos atualizados
            if (!result.Attributes) {
                this.logger.error(`Update para autor ${authorId} não retornou atributos. Verifique a operação no DynamoDB.`);
                throw new InternalServerErrorException('Falha ao obter os dados atualizados do autor.');
            }

            this.logger.log(`Autor ${authorId} atualizado com sucesso.`);

            // 4. Mapeia o resultado para o DTO
            const updatedAuthor = AuthorDetailDto.fromDynamoDB(result.Attributes as Record<string, any>);

            if (!updatedAuthor) {
                throw new InternalServerErrorException('Falha ao obter os dados atualizados do autor.');
            }

            // 5. Atualiza o cache para este autor específico e limpa cache da lista
            const cacheKey = this.getAuthorCacheKey(authorId);
            await this.cacheManager.set(cacheKey, updatedAuthor, this.cacheTtl);
            await this.clearAuthorsListCache(); // Invalida cache da lista completa
            this.logger.log(`Cache atualizado para o autor ${authorId}.`);

            return updatedAuthor;

        } catch (error) {
            // Se o erro for do nosso serviço DynamoDB, logamos de forma mais específica
            if (error instanceof DynamoDBOperationError) {
                this.logger.error(`Erro na operação DynamoDB ao atualizar autor ${authorId}: ${error.message}`, error.originalError);
            } else {
                this.logger.error(`Erro inesperado ao atualizar autor ${authorId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, error instanceof Error ? error.stack : undefined);
            }
            // Re-lança como erro interno genérico para o cliente, a menos que seja um erro específico tratável
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error; // Mantém erros de validação ou não encontrado
            }
            throw new InternalServerErrorException('Falha ao atualizar o autor no banco de dados.');
        }
    }

    /**
     * @ApiOperation Remove um autor pelo seu ID.
     * @ApiResponse Status 204: Autor removido com sucesso (No Content).
     * @ApiResponse Status 400: ID do autor inválido.
     * @ApiResponse Status 404: Autor não encontrado para remover.
     * @ApiResponse Status 500: Erro interno ao remover o autor.
     * @param authorId - O ID do autor a ser removido.
     * @returns Promise<void> - Retorna vazio em caso de sucesso.
     * @throws {BadRequestException} Se authorId for inválido.
     * @throws {NotFoundException} Se o autor não existir.
     * @throws {InternalServerErrorException} Se ocorrer erro no DynamoDB.
     */
    @ApiOperation({ summary: 'Remove um autor pelo ID' })
    @ApiResponse({ status: 204, description: 'Autor removido com sucesso.' })
    @ApiResponse({ status: 400, description: 'ID do autor inválido.' })
    @ApiResponse({ status: 404, description: 'Autor não encontrado.' })
    @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
    // @UseGuards(CognitoAuthGuard) // Descomente se precisar de autenticação
    async remove(authorId: string): Promise<void> {
        if (!authorId || typeof authorId !== 'string' || authorId.trim() === '') {
            throw new BadRequestException('O ID do autor deve ser uma string não vazia.');
        }
        this.logger.log(`Tentando remover autor com ID: ${authorId}`);

        // 1. Garante que o autor existe antes de tentar remover
        await this.findOne(authorId); // findOne lida com NotFoundException

        const params = {
            TableName: this.tableName,
            Key: { authorId }, // Chave primária do item a ser deletado
        };

        try {
            // 2. Chama o deleteItem do serviço DynamoDB
            await this.dynamoDbService.deleteItem(params);
            this.logger.log(`Autor ${authorId} removido com sucesso.`);

            // 3. Remove o autor do cache individual e limpa cache da lista
            const cacheKey = this.getAuthorCacheKey(authorId);
            await this.cacheManager.del(cacheKey);
            await this.clearAuthorsListCache();
            this.logger.log(`Cache removido/invalidado para o autor ${authorId}.`);

            // Retorna void (ou status 204 No Content no controller)
        } catch (error) {
            this.logger.error(`Erro ao remover autor ${authorId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, error instanceof Error ? error.stack : undefined);
            throw new InternalServerErrorException('Falha ao remover o autor do banco de dados.');
        }
    }

    /**
     * @ApiOperation Busca um autor pelo ID, utilizando cache para otimização.
     * @description Método interno usado por `findOne` e potencialmente outros locais.
     * Primeiro tenta buscar no cache; se não encontrar, busca no DynamoDB e armazena no cache.
     * @param authorId - ID do autor.
     * @returns Promise<AuthorDetailDto> - O DTO do autor.
     * @throws {NotFoundException} Se o autor não for encontrado no cache nem no DB.
     * @throws {InternalServerErrorException} Se ocorrer erro no DynamoDB.
     * @privateRemarks Usado internamente para centralizar a lógica de cache de `findOne`.
     */
    @ApiOperation({ summary: 'Busca um autor pelo ID (com cache)', description: 'Prioriza cache, depois busca no DB.' })
    @ApiResponse({ status: 200, description: 'Autor encontrado.', type: AuthorDetailDto })
    @ApiResponse({ status: 404, description: 'Autor não encontrado.' })
    @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
    async getAuthorById(authorId: string): Promise<AuthorDetailDto> {
        if (!authorId) {
            throw new BadRequestException('ID do autor não fornecido para getAuthorById.');
        }
        const cacheKey = this.getAuthorCacheKey(authorId);
        this.logger.debug(`Verificando cache para a chave: ${cacheKey}`);

        try {
            // 1. Tenta buscar no cache
            const cachedAuthor = await this.cacheManager.get<AuthorDetailDto>(cacheKey);
            if (cachedAuthor !== null && cachedAuthor !== undefined) {
                this.logger.log(`Autor ${authorId} encontrado no cache.`);
                // É importante retornar uma cópia para evitar mutações acidentais no objeto em cache
                // Verifica se cachedAuthor é null antes de tentar usar
                if (!cachedAuthor) {
                    this.logger.warn(`Autor com ID '${authorId}' não encontrado no cache.`);
                    throw new NotFoundException(`Autor com ID '${authorId}' não encontrado no cache.`);
                }
                const authorFromCache = AuthorDetailDto.fromDynamoDB(cachedAuthor as AuthorDetailDto);
                if (!authorFromCache) {
                    this.logger.error(`Falha ao mapear autor do cache para AuthorDetailDto (ID: ${authorId}).`);
                    throw new InternalServerErrorException(`Falha ao obter os dados do autor do cache.`);
                }
                return authorFromCache;
            }

            this.logger.log(`Autor ${authorId} não encontrado no cache. Buscando no DynamoDB...`);

            // 2. Se não está no cache, busca no DynamoDB
            const params = {
                TableName: this.tableName,
                Key: { authorId },
            };
            const result = await this.dynamoDbService.getItem(params);

            // 3. Verifica se o item foi encontrado no DB
            if (!result.Item) {
                this.logger.warn(`Autor com ID '${authorId}' não encontrado no DynamoDB.`);
                throw new NotFoundException(`Autor com ID '${authorId}' não encontrado.`);
            }

            // 4. Mapeia o item do DB para o DTO
            const author = AuthorDetailDto.fromDynamoDB(result.Item as Record<string, any>);

            if (!author) {
                throw new NotFoundException(`Autor com ID '${authorId}' não encontrado no banco de dados.`);
            }

            // 5. Salva no cache antes de retornar
            await this.cacheManager.set(cacheKey, author, this.cacheTtl);
            this.logger.log(`Autor ${authorId} salvo no cache com TTL ${this.cacheTtl}s.`);

            return author;

        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Erro ao buscar autor ${authorId} (via getAuthorById): ${error instanceof Error ? error.message : 'Erro desconhecido'}`, error instanceof Error ? error.stack : undefined);
            throw new InternalServerErrorException(`Falha ao buscar o autor ${authorId}.`);
        }
    }

    // --- Métodos auxiliares de Cache ---

    /**
     * Gera a chave de cache padrão para um autor específico.
     * @param authorId - O ID do autor.
     * @returns A string da chave de cache.
     */
    private getAuthorCacheKey(authorId: string): string {
        return `author_${authorId}`;
    }

    /**
     * Gera a chave de cache padrão para a lista de todos os autores.
     * @returns A string da chave de cache.
     */
    private getAuthorsListCacheKey(): string {
        return `authors_all`;
    }


    /**
     * Limpa (invalida) o cache da lista completa de autores.
     * Deve ser chamado após criar, atualizar ou remover um autor.
     */
    private async clearAuthorsListCache(): Promise<void> {
        const listCacheKey = this.getAuthorsListCacheKey();
        await this.cacheManager.del(listCacheKey);
        this.logger.log(`Cache da lista de autores (${listCacheKey}) invalidado.`);
    }

}