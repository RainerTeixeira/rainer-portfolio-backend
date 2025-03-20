import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCategoryDto } from '@src/modules/blog/category/dto/create-category.dto';
import { UpdateCategoryDto } from '@src/modules/blog/category/dto/update-category.dto';
import { CategoryDto } from '@src/modules/blog/category/dto/category.dto';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { UpdateCommandInput } from '@aws-sdk/lib-dynamodb';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * @CategoryService
 * Serviço responsável pela lógica de negócio das categorias.
 */
@ApiTags('category')
@Injectable()
export class CategoryService {
    private readonly tableName = 'Category';

    constructor(private readonly dynamoDbService: DynamoDbService) { }

    /**
     * Cria uma nova categoria.
     * @param createCategoryDto - Dados para criar a categoria.
     * @returns A categoria criada.
     */
    @ApiOperation({ summary: 'Criar uma nova categoria' })
    @ApiResponse({ status: 201, description: 'A categoria foi criada com sucesso.', type: CategoryDto })
    async create(createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
        const params = {
            TableName: this.tableName,
            Item: createCategoryDto,
        };
        await this.dynamoDbService.putItem(params);
        return this.findOne(createCategoryDto.categoryId);
    }

    /**
     * Obtém todas as categorias.
     * @returns Uma lista de todas as categorias.
     */
    @ApiOperation({ summary: 'Obter todas as categorias' })
    @ApiResponse({ status: 200, description: 'Retorna todas as categorias.', type: [CategoryDto] })
    async findAll(): Promise<CategoryDto[]> {
        const result = await this.dynamoDbService.scan({ TableName: this.tableName });
        return (result.Items || []).map(item => this.mapCategoryFromDynamoDb(item));
    }

    /**
     * Obtém uma categoria por ID.
     * @param categoryId - ID da categoria.
     * @returns A categoria encontrada.
     * @throws NotFoundException Se a categoria não for encontrada.
     */
    @ApiOperation({ summary: 'Obter uma categoria por ID' })
    @ApiResponse({ status: 200, description: 'Retorna a categoria.', type: CategoryDto })
    @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
    async findOne(categoryId: string): Promise<CategoryDto> {
        const params = {
            TableName: this.tableName,
            Key: { categoryId: categoryId },
        };
        const result = await this.dynamoDbService.getItem(params);
        if (!result.Item) {
            throw new NotFoundException(`Category com ID '${categoryId}' não encontrada`);
        }
        return this.mapCategoryFromDynamoDb(result.Item);
    }

    async getCategoryById(categoryId: string): Promise<CategoryDto> {
        return this.findOne(categoryId);
    }

    /**
     * Atualiza uma categoria por ID.
     * @param categoryId - ID da categoria a ser atualizada.
     * @param updateCategoryDto - Dados para atualizar a categoria.
     * @returns A categoria atualizada.
     * @throws NotFoundException Se a categoria não for encontrada.
     */
    @ApiOperation({ summary: 'Atualizar uma categoria por ID' })
    @ApiResponse({ status: 200, description: 'A categoria foi atualizada com sucesso.', type: CategoryDto })
    @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
    async update(categoryId: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryDto> {
        // Verifica se a categoria existe antes de atualizar
        await this.findOne(categoryId);

        const updateExpression = this.dynamoDbService.buildUpdateExpression(updateCategoryDto);
        if (!updateExpression) {
            throw new BadRequestException('Nenhum dado fornecido para atualização');
        }

        const params: UpdateCommandInput = {
            TableName: this.tableName,
            Key: { categoryId },
            ...updateExpression,
            ReturnValues: 'ALL_NEW',
        };

        const result = await this.dynamoDbService.updateItem(params);
        return this.mapCategoryFromDynamoDb(result.Attributes as Record<string, unknown>);
    }

    /**
     * Remove uma categoria por ID.
     * @param categoryId - ID da categoria a ser removida.
     * @throws NotFoundException Se a categoria não for encontrada.
     */
    @ApiOperation({ summary: 'Deletar uma categoria por ID' })
    @ApiResponse({ status: 204, description: 'A categoria foi deletada com sucesso.' })
    @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
    async remove(categoryId: string): Promise<void> {
        // Verifica se a categoria existe antes de deletar
        await this.findOne(categoryId);

        const params = {
            TableName: this.tableName,
            Key: { categoryId },
        };
        await this.dynamoDbService.deleteItem(params);
    }

    /**
     * Mapeia um item retornado do DynamoDB para um CategoryDto.
     * Converte o formato de dados do DynamoDB para o formato CategoryDto da aplicação.
     * @param item Item retornado do DynamoDB.
     * @returns Um CategoryDto preenchido com os dados do item.
     * @private
     */
    private mapCategoryFromDynamoDb(item: Record<string, unknown>): CategoryDto {
        const seo = (item.seo as Record<string, unknown>) || {};
        return {
            categoryId: item.categoryId as string,
            name: item.name as string,
            slug: item.slug as string,
            seo: {
                canonical: seo.canonical as string | undefined,
                description: seo.description as string | undefined,
                keywords: (seo.keywords as unknown as string[]) || [],
            },
        } as CategoryDto;
    }
}
