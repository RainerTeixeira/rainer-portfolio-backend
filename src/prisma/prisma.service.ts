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
   * Hook de inicialização do módulo NestJS.
   *
   * Inicia a conexão com o banco quando `DATABASE_PROVIDER` é `PRISMA`, mas não bloqueia o
   * bootstrap do servidor: a conexão é disparada em background via `setImmediate`.
   * Quando `DATABASE_PROVIDER` não é `PRISMA`, apenas loga que o serviço está disponível.
   *
   * @returns void
   *
   * @remarks
   * - Evita atrasos de cold start ao não aguardar a conexão do Prisma.
   * - Erros de conexão são capturados e logados, sem interromper a subida do servidor.
   */
  onModuleInit() {
    const provider = process.env.DATABASE_PROVIDER || 'PRISMA';
    
    // Apenas tenta conectar se estiver usando PRISMA
    if (provider === 'PRISMA') {
      // Conectar de forma totalmente não-bloqueante usando setImmediate
      // Isso garante que a inicialização do módulo não seja bloqueada
      setImmediate(() => {
        this.connectAsync().catch((error) => {
          this.logger.warn(`⚠️  Falha na conexão assíncrona: ${error instanceof Error ? error.message : String(error)}`);
        });
      });
      this.logger.log('ℹ️  PrismaService iniciado - conexão em background...');
    } else {
      this.logger.log(`ℹ️  PrismaService disponível mas não ativo (DATABASE_PROVIDER=${provider})`);
    }
    
    // Não retornar Promise - permite que o módulo seja considerado inicializado imediatamente
  }

  /**
   * Efetua a conexão ao MongoDB (via Prisma) de forma assíncrona, com timeout defensivo.
   *
   * Utiliza `Promise.race` entre `this.$connect()` e um timeout de 5 segundos para evitar travamentos
   * quando o banco está indisponível. Em falha, informa logs com ações sugeridas e não propaga o erro.
   *
   * @returns Promise que resolve quando conectado ou quando o timeout/erro é tratado.
   *
   * @example
   * // Disparo em background no onModuleInit
   * setImmediate(() => this.connectAsync());
   *
   * @remarks
   * - Não rejeita a promessa para permitir que o servidor continue operando (com limitação de operações de DB).
   * - Recomenda uso de `DATABASE_PROVIDER=DYNAMODB` em desenvolvimento caso não haja MongoDB disponível.
   */
  private async connectAsync(): Promise<void> {
    try {
      this.logger.log('Conectando ao banco de dados (Prisma/MongoDB)...');
      
      // Usar Promise.race com timeout curto para evitar travamento
      const connectPromise = this.$connect();
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na conexão com MongoDB após 5s')), 5000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);
      this.logger.log('✅ Conectado ao banco de dados!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`⚠️  Não foi possível conectar ao MongoDB: ${errorMessage}`);
      this.logger.warn('💡 O servidor continuará iniciando, mas operações de banco podem falhar');
      this.logger.warn('💡 Verifique se o MongoDB está rodando: docker ps | grep mongo');
      this.logger.warn('💡 Ou defina DATABASE_PROVIDER=DYNAMODB no .env para usar DynamoDB');
      // Não propagar erro - deixa servidor iniciar mesmo sem DB
    }
  }

  /**
   * Hook de destruição do módulo NestJS.
   *
   * Fecha graciosamente a conexão Prisma ao encerrar o módulo, garantindo liberação de recursos.
   *
   * @returns Promise resolvida quando a desconexão é concluída.
   */
  async onModuleDestroy() {
    this.logger.log('Desconectando do banco de dados...');
    await this.$disconnect();
    this.logger.log('✅ Desconectado do banco de dados!');
  }
}

