import { DynamoDbService } from '@src/services/dynamoDb.service'; // Importa o serviço DynamoDbService
import { Injectable, NotFoundException, Logger } from '@nestjs/common'; // Importa Injectable, NotFoundException e Logger do NestJS
import { UpdateCommandInput } from '@aws-sdk/lib-dynamodb'; // Importa UpdateCommandInput do AWS SDK for DynamoDB
import { CreateAuthorDto } from '@src/modules/blog/authors/dto/Create-author.dto'; // Importa DTO para criação de autor
import { UpdateAuthorDto } from '@src/modules/blog/authors/dto/Update-author.dto'; // Importa DTO para atualização de autor
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
     * Injeta a instância de DynamoDbService para interagir com o DynamoDB.
     * @param dynamoDbService Serviço de acesso ao DynamoDB.
     */
    constructor(private readonly dynamoDbService: DynamoDbService) { }

    /**
     * Cria um novo autor no DynamoDB.
     * @param createAuthorDto DTO contendo os dados para criar um novo autor.
     * @returns Uma Promise que resolve para um AuthorDetailDto representando o autor criado.
     */
    async create(createAuthorDto: CreateAuthorDto): Promise<AuthorDetailDto> {
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
     * @returns Uma Promise que resolve para um array de AuthorDetailDto ou uma mensagem caso não haja autores.
     */
    async findAll(): Promise<AuthorDetailDto[] | { message: string }> {
        this.logger.log('Buscando todos os autores.');

        const params = {
            TableName: this.tableName,
        };

        const result = await this.dynamoDbService.scan(params);

        console.log("Dados brutos do DynamoDB:", JSON.stringify(result.Items, null, 2));

        // Se não houver itens, retorna uma mensagem informando que não há autores cadastrados
        if (!result.Items || result.Items.length === 0) {
            return { message: "Nenhum autor cadastrado." };
        }

        // Agora usamos o método estático do DTO para fazer a conversão
        return result.Items.map(AuthorDetailDto.fromDynamoDB); // Utiliza o método estático do DTO
    }



    /**
     * Busca um autor específico pelo seu authorId no DynamoDB.
     * @param authorId ID do autor a ser buscado.
     * @returns Uma Promise que resolve para um AuthorDetailDto, se o autor for encontrado.
     * @throws NotFoundException Se o autor não for encontrado.
     */
    async findOne(authorId: string): Promise<AuthorDetailDto> {
        this.logger.log(`Buscando autor com authorId: ${authorId}`); // Log de busca de autor por ID

        // Parâmetros para buscar o autor pela chave primária
        const params = {
            TableName: this.tableName,
            Key: {
                authorId: authorId, // Usa authorId como chave primária para a busca
            },
        };

        // Realiza a busca no DynamoDB usando getItem
        const result = await this.dynamoDbService.getItem(params);

        // Verifica se o autor foi encontrado
        if (!result.Item) {
            this.logger.warn(`Autor com authorId '${authorId}' não encontrado.`); // Log de aviso se autor não encontrado
            throw new NotFoundException(`Autor com authorId '${authorId}' não encontrado`); // Lança exceção NotFoundException
        }

        // Mapeia e retorna o item como AuthorDetailDto
        return AuthorDetailDto.fromDynamoDB(result.Item); // Usa o método estático para converter os dados do DynamoDB
    }





    /**
     * Atualiza um autor existente no DynamoDB.
     * @param authorId ID do autor a ser atualizado.
     * @param updateAuthorDto DTO contendo os dados a serem atualizados do autor.
     * @returns Uma Promise que resolve para um AuthorDetailDto representando o autor atualizado.
     * @throws NotFoundException Se o autor não for encontrado.
     */
    async update(authorId: string, updateAuthorDto: UpdateAuthorDto): Promise<AuthorDetailDto> {
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
        return this.mapAuthorFromDynamoDb(result.Attributes as Record<string, any>) as AuthorDetailDto; // Mapeia e retorna o autor atualizado
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
     * Mapeia um item retornado do DynamoDB para um AuthorDetailDto.
     * Converte o formato de dados do DynamoDB para o formato AuthorDetailDto da aplicação.
     * @param item Item retornado do DynamoDB.
     * @returns Um AuthorDetailDto preenchido com os dados do item do DynamoDB.
     * @private
     */
    private mapAuthorFromDynamoDb(item: Record<string, any>): AuthorDetailDto {
        return {
            authorId: item.authorId?.S, // Extrai e mapeia authorId (String)
            name: item.name?.S, // Extrai e mapeia name (String)
            slug: item.slug?.S, // Extrai e mapeia slug (String)
            expertise: item.expertise?.L?.map((expertiseItem: any) => expertiseItem.S) || [], // Extrai e mapeia expertise (Lista de Strings)
            socialProof: Object.entries(item.socialProof?.M || {}).reduce((obj: { [key: string]: string }, [key, value]: [string, any]) => { // Extrai e mapeia socialProof (Mapa String -> String)
                obj[key] = value?.S;
                return obj;
            }, {}) as { [key: string]: string } || {},
        } as AuthorDetailDto;
    }
}