import { Exclude, Expose } from 'class-transformer';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

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

  constructor(partial?: Partial<CategoryEntity>) {
    if (partial) {
      Object.assign(this, partial);
      if (!partial.pk && partial.id) {
        this.pk = `CATEGORY#${partial.id}`;
      }
    }
  }

  // Getter para ID (remove o prefixo)
  get id(): string {
    return this.pk?.replace('CATEGORY#', '') ?? '';
  }

  set id(value: string) {
    this.pk = `CATEGORY#${value}`;
  }

  // Método para converter para DynamoDB
  static toDynamoDB(category: CategoryEntity): Record<string, AttributeValue> {
    return marshall(category);
  }

  // Método para converter do DynamoDB
  static fromDynamoDB(dynamoItem: Record<string, AttributeValue>): CategoryEntity {
    return unmarshall(dynamoItem) as CategoryEntity;
  }
}