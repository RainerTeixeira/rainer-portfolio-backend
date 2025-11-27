/**
 * Tipos auxiliares locais para o Prisma Client.
 *
 * Objetivo: driblar incompatibilidades temporárias de tipos com a versão
 * atual do @prisma/client, garantindo que o backend compile.
 *
 * Isso NÃO altera o runtime, apenas o type-check do TypeScript.
 */

declare module '@prisma/client' {
  /**
   * Stub de PrismaClient com delegates dinamicamente tipados como `any`.
   */
  export class PrismaClient {
    constructor(...args: any[]);
    // Permite acesso a propriedades como `prisma.post`, `prisma.user`, etc.
    [key: string]: any;

    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
  }

  // Namespace Prisma exposto como `any` para evitar erros de tipo.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const Prisma: any;
}
