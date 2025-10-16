/**
 * Decorator para adicionar header de seleção de database provider no Swagger
 * 
 * Este decorator adiciona um header customizado que permite escolher
 * entre Prisma (MongoDB) e DynamoDB diretamente no Swagger.
 * 
 * @module utils/database-provider/database-provider.decorator
 */

import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

/**
 * Decorator que adiciona o header X-Database-Provider no Swagger
 * 
 * Uso:
 * ```typescript
 * @DatabaseProviderHeader()
 * @Get()
 * async findAll() { ... }
 * ```
 * 
 * No Swagger, aparecerá um dropdown para escolher:
 * - PRISMA (MongoDB)
 * - DYNAMODB
 */
export function DatabaseProviderHeader() {
  return applyDecorators(
    ApiHeader({
      name: 'X-Database-Provider',
      description: '🗄️ Escolha o banco de dados (PRISMA = MongoDB, DYNAMODB = AWS)',
      required: false,
      enum: ['PRISMA', 'DYNAMODB'],
      schema: {
        type: 'string',
        enum: ['PRISMA', 'DYNAMODB'],
        default: 'PRISMA',
      },
    }),
  );
}

