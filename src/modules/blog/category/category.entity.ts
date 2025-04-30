import { Exclude, Expose } from 'class-transformer';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

/**
 * Entidade que representa uma categoria no domínio do blog.
 * Utilizada para mapear os dados armazenados no DynamoDB e expor propriedades relevantes para a aplicação.
 * Inclui métodos utilitários para conversão entre o formato da aplicação e o formato do DynamoDB.
 */
@Exclude()
export class CategoryEntity {
  // PK: CATEGORY#id
  @Expose()
  pk: string; // Armazena como 'CATEGORY#id'

  // SK: METADATA (fixo)
  @Expose()
  sk: string = 'METADATA';

  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  description: string;

  @Expose()
  keywords: string[];

  @Expose()
  postCount: number;

  @Expose()
  metaDescription: string;

  @Expose()
  createdAt: string;

  @Expose()
  updatedAt: string;

  @Expose()
  type: string = 'CATEGORY';

  // GSI_Slug (índice secundário)
  @Expose()
  gsiSlug?: string;

  // GSI_Popular (índice secundário)
  @Expose()
  gsiPopular?: number;

  /**
   * Construtor que permite inicializar a entidade a partir de um objeto parcial.
   * Caso seja fornecido apenas o id, monta o pk automaticamente.
   * @param partial Objeto parcial para inicialização.
   */
  constructor(partial?: Partial<CategoryEntity>) {
    if (partial) {
      Object.assign(this, partial);
      if (!partial.pk && partial.id) {
        this.pk = `CATEGORY#${partial.id}`;
      }
    }
  }

  /**
   * Getter para obter o id da categoria a partir do pk.
   * Remove o prefixo 'CATEGORY#' do pk.
   */
  get id(): string {
    return this.pk?.replace('CATEGORY#', '') ?? '';
  }

  /**
   * Setter para definir o id da categoria, ajustando o pk com o prefixo 'CATEGORY#'.
   */
  set id(value: string) {
    this.pk = `CATEGORY#${value}`;
  }

  /**
   * Converte a entidade CategoryEntity para o formato aceito pelo DynamoDB.
   * @param category Instância da entidade a ser convertida.
   * @returns Objeto no formato do DynamoDB.
   */
  static toDynamoDB(category: CategoryEntity): Record<string, AttributeValue> {
    return marshall(category);
  }

  /**
   * Converte um item do DynamoDB para uma instância de CategoryEntity.
   * @param dynamoItem Objeto no formato do DynamoDB.
   * @returns Instância de CategoryEntity.
   */
  static fromDynamoDB(dynamoItem: Record<string, AttributeValue>): CategoryEntity {
    return unmarshall(dynamoItem) as CategoryEntity;
  }
}