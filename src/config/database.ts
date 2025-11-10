/**
 * Configuração do Cliente Prisma
 * 
 * Este módulo configura e exporta o cliente Prisma para acesso ao MongoDB.
 * 
 * **Funcionamento:**
 * - Usado principalmente em desenvolvimento local com MongoDB
 * - Alternativa ao DynamoDB quando estiver desenvolvendo sem AWS
 * 
 * **Propósito:**
 * O Prisma é um ORM (Object-Relational Mapping) que facilita o acesso ao banco
 * de dados com TypeScript. Ele gera tipos automáticos baseados no schema e
 * oferece uma API limpa e segura.
 * 
 * **Quando usar:**
 * - Desenvolvimento local sem DynamoDB Local
 * - Testes de integração que não precisam do DynamoDB
 * - Prototipagem rápida de novas features
 * 
 * @module config/prisma
 */

import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

/**
 * Cliente Prisma Singleton
 * 
 * **O que é Singleton?**
 * Garante que só existe UMA instância do Prisma em toda a aplicação.
 * Isso evita criar múltiplas conexões desnecessárias com o banco.
 * 
 * **Configurações:**
 * 
 * 1. **Logs por Ambiente:**
 *    - Desenvolvimento: Mostra todas as queries SQL, erros e avisos (útil para debug)
 *    - Produção: Mostra apenas erros (melhor performance)
 * 
 * 2. **Connection Pooling (Automático):**
 *    - Prisma mantém um pool de conexões abertas
 *    - Reutiliza conexões para melhor performance
 *    - Fecha automaticamente conexões ociosas
 * 
 * 3. **Graceful Shutdown:**
 *    - Use `disconnectPrisma()` antes de encerrar a aplicação
 *    - Garante que todas as operações pendentes sejam finalizadas
 *    - Fecha as conexões de forma segura
 * 
 * **Como usar:**
 * Importe o cliente e use os modelos definidos no schema.prisma
 * 
 * @example
 * // Buscar todos os usuários
 * import { prisma } from './config/database';
 * 
 * const users = await prisma.user.findMany();
 * console.log(users); // Array de usuários
 * 
 * @example
 * // Criar um novo post
 * import { prisma } from './config/database';
 * 
 * const post = await prisma.post.create({
 *   data: {
 *     title: 'Meu Primeiro Post',
 *     content: 'Conteúdo do post...',
 *     authorId: '123',
 *     published: true
 *   }
 * });
 * 
 * @example
 * // Buscar posts de um usuário específico com relacionamentos
 * import { prisma } from './config/database';
 * 
 * const userPosts = await prisma.post.findMany({
 *   where: { authorId: '123' },
 *   include: {
 *     author: true,      // Inclui dados do autor
 *     comments: true,    // Inclui comentários
 *     categories: true   // Inclui categorias
 *   }
 * });
 * 
 * @example
 * // Atualizar um usuário
 * import { prisma } from './config/database';
 * 
 * const updated = await prisma.user.update({
 *   where: { id: '123' },
 *   data: { fullName: 'Novo Nome' }
 * });
 * 
 * @see {@link https://www.prisma.io/docs/reference/api-reference/prisma-client-reference}
 */
export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

/**
 * Desconecta o Prisma do banco de dados de forma segura
 * 
 * **Quando usar:**
 * - Ao encerrar a aplicação (SIGTERM, SIGINT)
 * - Ao finalizar testes de integração
 * - Antes de fazer deploy (em alguns casos)
 * 
 * **O que faz:**
 * - Aguarda todas as operações pendentes terminarem
 * - Fecha todas as conexões do pool
 * - Libera recursos do sistema
 * 
 * **Importante:**
 * Se você não chamar esta função, o Node.js pode não encerrar
 * corretamente porque ficará aguardando as conexões abertas.
 * 
 * @example
 * // Em main.ts ou app.ts
 * import { disconnectPrisma } from './config/database';
 * 
 * process.on('SIGTERM', async () => {
 *   console.log('Encerrando aplicação...');
 *   await disconnectPrisma();
 *   process.exit(0);
 * });
 * 
 * @example
 * // Em testes
 * import { disconnectPrisma } from './config/database';
 * 
 * afterAll(async () => {
 *   await disconnectPrisma();
 * });
 * 
 * @returns Promise que resolve quando a desconexão for completa
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

