/**
 * Prisma Service
 * 
 * Serviço que encapsula o PrismaClient para uso em toda a aplicação.
 * Gerencia conexão e desconexão do banco de dados.
 * 
 * @module prisma/prisma.service
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Serviço do Prisma
 * Estende PrismaClient com lifecycle hooks do NestJS
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  /**
   * Conecta ao banco quando o módulo é inicializado
   */
  async onModuleInit() {
    this.logger.log('Conectando ao banco de dados...');
    await this.$connect();
    this.logger.log('✅ Conectado ao banco de dados!');
  }

  /**
   * Desconecta do banco quando o módulo é destruído
   */
  async onModuleDestroy() {
    this.logger.log('Desconectando do banco de dados...');
    await this.$disconnect();
    this.logger.log('✅ Desconectado do banco de dados!');
  }
}

