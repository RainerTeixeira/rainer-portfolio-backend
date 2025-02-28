import { DynamoDbService } from '@src/services/dynamoDb.service'; // Importa o serviço DynamoDbService
import { Injectable, NotFoundException, Logger } from '@nestjs/common'; // Importa Injectable, NotFoundException e Logger do NestJS
import { UpdateCommandInput } from '@aws-sdk/lib-dynamodb'; // Importa UpdateCommandInput do AWS SDK for DynamoDB
import { CreateAuthorDto } from '@src/modules/blog/authors/dto/Create-author.dto'; // Importa DTO para criação de autor
import { UpdateAuthorDto } from '@src/modules/blog/authors/dto/Update-author.dto'; // Importa DTO para atualização de autor
import { AuthorDto } from '@src/modules/blog/authors/dto/Author-detail.dto'; // Importa DTO para representação de autor

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
     * Injeta a instância de DynamoDbService para interagir com o DynamoDB.
     * @param dynamoDbService Serviço de acesso ao DynamoDB.
     */
    constructor(private readonly dynamoDbService: DynamoDbService) { }

    /**
     * Cria um novo autor no DynamoDB.
     * @param createAuthorDto DTO contendo os dados para criar um novo autor.
     * @returns Uma Promise que resolve para um AuthorDto representando o autor criado.
     */
    async create(createAuthorDto: CreateAuthorDto): Promise<AuthorDto> {
        this.logger.log(`Criando autor com authorId: ${createAuthorDto.authorId}`); // Log de criação de autor
        const params = {
            TableName: this.tableName,
            Item: createAuthorDto, // Utiliza o DTO de criação como item a ser inserido
        };
        await this.dynamoDbService.putItem(params); // Salva o autor no DynamoDB
        return this.findOne(createAuthorDto.authorId); // Retorna o autor recém-criado
    }

    /**
     * Busca todos os autores no DynamoDB.
     * @returns Uma Promise que resolve para um array de AuthorDto, contendo todos os autores.
     */
    async findAll(): Promise<AuthorDto[]> {
        this.logger.log('Buscando todos os autores.'); // Log de busca de todos os autores
        const params = {
            TableName: this.tableName,
            // IndexName: 'your-index-name', // Exemplo de uso de GSI (Índice Secundário Global) se necessário
        };
        const result = await this.dynamoDbService.scan(params); // Escaneia a tabela Authors
        return (result.Items || []).map(item => this.mapAuthorFromDynamoDb(item)); // Mapeia e retorna os itens como AuthorDto
    }

    /**
     * Busca um autor específico pelo seu authorId no DynamoDB.
     * @param authorId ID do autor a ser buscado.
     * @returns Uma Promise que resolve para um AuthorDto, se o autor for encontrado.
     * @throws NotFoundException Se o autor não for encontrado.
     */
    async findOne(authorId: string): Promise<AuthorDto> {
        this.logger.log(`Buscando autor com authorId: ${authorId}`); // Log de busca de autor por ID
        const params = {
            TableName: this.tableName,
            Key: {
                authorId: authorId, // Usa authorId como chave primária para busca
            },
        };
        const result = await this.dynamoDbService.getItem(params); // Busca o item no DynamoDB pela chave

        if (!result.Item) {
            this.logger.warn(`Autor com authorId '${authorId}' não encontrado.`); // Log de aviso se autor não encontrado
            throw new NotFoundException(`Autor com authorId '${authorId}' não encontrado`); // Lança exceção NotFoundException
        }
        return this.mapAuthorFromDynamoDb(result.Item); // Mapeia e retorna o item como AuthorDto
    }

    /**
     * Atualiza um autor existente no DynamoDB.
     * @param authorId ID do autor a ser atualizado.
     * @param updateAuthorDto DTO contendo os dados a serem atualizados do autor.
     * @returns Uma Promise que resolve para um AuthorDto representando o autor atualizado.
     * @throws NotFoundException Se o autor não for encontrado.
     */
    async update(authorId: string, updateAuthorDto: UpdateAuthorDto): Promise<AuthorDto> {
        this.logger.log(`Atualizando autor com authorId: ${authorId}`); // Log de atualização de autor
        // Verifica se o autor existe antes de atualizar
        await this.findOne(authorId); // Garante que o autor existe antes de prosseguir

        const updateExpression = this.dynamoDbService.buildUpdateExpression(updateAuthorDto); // Constrói a expressão de atualização
        if (!updateExpression) {
            this.logger.warn(`Nenhum campo para atualizar fornecido para authorId: ${authorId}. Retornando autor existente.`); // Log de aviso se não houver campos para atualizar
            return this.findOne(authorId); // Se não houver campos para atualizar, retorna o autor existente
        }

        const params: UpdateCommandInput = { // Parâmetros para a operação de atualização no DynamoDB
            TableName: this.tableName,
            Key: {
                authorId: authorId, // Usa authorId como chave primária para atualização
            },
            ...updateExpression, // Aplica UpdateExpression, ExpressionAttributeNames e ExpressionAttributeValues
            ReturnValues: 'ALL_NEW', // Retorna todos os atributos do item APÓS a atualização
        };

        const result = await this.dynamoDbService.updateItem(params); // Executa a operação de atualização no DynamoDB
        return this.mapAuthorFromDynamoDb(result.Attributes as Record<string, any>) as AuthorDto; // Mapeia e retorna o autor atualizado
    }

    /**
     * Remove um autor do DynamoDB pelo seu authorId.
     * @param authorId ID do autor a ser removido.
     * @returns Uma Promise que resolve void (sem retorno), indicando sucesso na remoção.
     * @throws NotFoundException Se o autor não for encontrado.
     */
    async remove(authorId: string): Promise<void> {
        this.logger.log(`Removendo autor com authorId: ${authorId}`); // Log de remoção de autor
        // Verifica se o autor existe antes de deletar
        await this.findOne(authorId); // Garante que o autor existe antes de prosseguir

        const params = {
            TableName: this.tableName,
            Key: {
                authorId: authorId, // Usa authorId como chave primária para remoção
            },
        };
        await this.dynamoDbService.deleteItem(params); // Remove o autor do DynamoDB
    }

    /**
     * Mapeia um item retornado do DynamoDB para um AuthorDto.
     * Converte o formato de dados do DynamoDB para o formato AuthorDto da aplicação.
     * @param item Item retornado do DynamoDB.
     * @returns Um AuthorDto preenchido com os dados do item do DynamoDB.
     * @private
     */
    private mapAuthorFromDynamoDb(item: Record<string, any>): AuthorDto {
        return {
            authorId: item.authorId?.S, // Extrai e mapeia authorId (String)
            name: item.name?.S, // Extrai e mapeia name (String)
            slug: item.slug?.S, // Extrai e mapeia slug (String)
            expertise: item.expertise?.L?.map((expertiseItem: any) => expertiseItem.S) || [], // Extrai e mapeia expertise (Lista de Strings)
            socialProof: Object.entries(item.socialProof?.M || {}).reduce((obj: { [key: string]: string }, [key, value]: [string, any]) => { // Extrai e mapeia socialProof (Mapa String -> String)
                obj[key] = value?.S;
                return obj;
            }, {}) as { [key: string]: string } || {},
        } as AuthorDto;
    }
}