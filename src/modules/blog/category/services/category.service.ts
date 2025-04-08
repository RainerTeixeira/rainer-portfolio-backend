import { Injectable, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { CreateCategoryDto } from '@src/modules/blog/category/dto/create-category.dto';
import { UpdateCategoryDto } from '@src/modules/blog/category/dto/update-category.dto';
import { CategoryDto } from '@src/modules/blog/category/dto/category.dto';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AttributeValue } from '@aws-sdk/client-dynamodb'; // Importado para corrigir os erros de tipo

/**
 * @CategoryService
 * Serviço responsável pela lógica de negócio das categorias.
 */
@ApiTags('category')
@Injectable()
export class CategoryService {
    private readonly tableName = process.env.DYNAMO_TABLE_NAME_CATEGORIES || 'Category';
    private readonly logger = new Logger(CategoryService.name);

    constructor(private readonly dynamoDbService: DynamoDbService) { }

    /**
     * Cria uma nova categoria.
     * @param createCategoryDto - Dados para criar a categoria.
     * @returns A categoria criada.
     */
    @ApiOperation({ summary: 'Criar uma nova categoria' })
    @ApiResponse({ status: 201, description: 'A categoria foi criada com sucesso.', type: CategoryDto })
    async create(createCategoryDto: CreateCategoryDto): Promise<{ success: boolean; data: CategoryDto }> {
        this.logger.log(`Criando categoria com ID: ${createCategoryDto.categoryId}`);

        // Instanciando o DTO fora da classe

        const params = {
            TableName: this.tableName,
            Item: {
                categoryId: { S: createCategoryDto.categoryId },
                name: { S: createCategoryDto.name },
                slug: { S: createCategoryDto.slug },
                seo: { M: createCategoryDto.seo },
            },
            ConditionExpression: 'attribute_not_exists(categoryId)', // Garante que não existe
        };
        await this.dynamoDbService.putItem(params);
        const category = await this.findOne(createCategoryDto.categoryId);
        return { success: true, data: category.data };
    }

    /**
     * Obtém todas as categorias.
     * @returns Uma lista de todas as categorias.
     */
    @ApiOperation({ summary: 'Obter todas as categorias' })
    @ApiResponse({ status: 200, description: 'Retorna todas as categorias.', type: [CategoryDto] })
    async findAll(): Promise<{ success: boolean; data: CategoryDto[] }> {
        const result = await this.dynamoDbService.scan({ TableName: this.tableName });
        const items = result.data.Items || []; // Acesse `data` antes de `Items`
        const categories = items.map(item => this.mapCategoryFromDynamoDb(item));
        return { success: true, data: categories };
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
    async findOne(categoryId: string): Promise<{ success: boolean; data: CategoryDto }> {
        const params = {
            TableName: this.tableName,
            Key: { categoryId: { S: categoryId } },
        };
        const result = await this.dynamoDbService.getItem(params);
        const item = result.data.Item; // Acesse `data` antes de `Item`
        if (!item) {
            throw new NotFoundException(`Category com ID '${categoryId}' não encontrada`);
        }
        const category = this.mapCategoryFromDynamoDb(item);
        return { success: true, data: category };
    }

    async getCategoryById(categoryId: string): Promise<CategoryDto> {
        const result = await this.findOne(categoryId);
        return result.data;
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
    async update(categoryId: string, updateCategoryDto: UpdateCategoryDto): Promise<{ success: boolean; data: CategoryDto }> {
        await this.findOne(categoryId);

        const updateData = this.mapDtoToDynamoAttributes(updateCategoryDto);

        const result = await this.dynamoDbService.updateItem(
            this.tableName,
            { categoryId: { S: categoryId } },
            updateData,
            'ALL_NEW'
        );

        const attributes = result.data.Attributes;
        if (!attributes) {
            throw new InternalServerErrorException('Falha ao obter os dados atualizados da categoria.');
        }

        const updatedCategory = this.mapCategoryFromDynamoDb(attributes as Record<string, unknown>);
        return { success: true, data: updatedCategory };
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
            Key: { categoryId: { S: categoryId } },
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
        interface Seo {
            metaTitle?: string;
            priority?: string;
            // ...outras propriedades existentes...
        }

        const seo: Seo = {
            metaTitle: typeof item.seo === 'object' && item.seo?.['metaTitle'] && typeof item.seo['metaTitle'] === 'string'
                ? item.seo['metaTitle']
                : undefined,
            priority: typeof item.seo === 'object' && item.seo?.['priority'] && typeof item.seo['priority'] === 'string'
                ? item.seo['priority']
                : undefined,
        };

        return {
            categoryId: item.categoryId && typeof item.categoryId === 'string' ? item.categoryId : '',
            name: item.name && typeof item.name === 'string' ? item.name : '',
            slug: item.slug && typeof item.slug === 'string' ? item.slug : '',
            seo: seo,
        };
    }

    private mapDtoToDynamoAttributes(dto: UpdateCategoryDto): Record<string, AttributeValue> {
        const attributes: Record<string, AttributeValue> = {};
        if (dto.name) attributes['name'] = { S: dto.name };
        if (dto.slug) attributes['slug'] = { S: dto.slug };
        if (dto.seo) {
            attributes['seo'] = {
                M: Object.entries(dto.seo).reduce<Record<string, AttributeValue>>((acc, [key, value]) => {
                    acc[key] = { S: value }; // Converte os valores para AttributeValue
                    return acc;
                }, {}),
            };
        }
        return attributes;
    }
}
