/**
 * Interceptor para capturar o header X-Database-Provider
 * 
 * Este interceptor lê o header enviado pelo cliente e
 * define o provider no contexto da requisição.
 * 
 * @module utils/database-provider/database-provider.interceptor
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { DatabaseProviderContextService, DatabaseProvider } from './database-provider-context.service.js';

/**
 * Interceptor que captura o header X-Database-Provider
 * 
 * Lê o header da requisição e define o provider no contexto.
 * Se não houver header, usa o padrão do .env
 * 
 * @example
 * // No controller
 * @UseInterceptors(DatabaseProviderInterceptor)
 * @Get()
 * async findAll() { ... }
 */
@Injectable()
export class DatabaseProviderInterceptor implements NestInterceptor {
  constructor(private readonly databaseContext: DatabaseProviderContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Captura o header (case-insensitive)
    const providerHeader = 
      request.headers['x-database-provider'] || 
      request.headers['X-Database-Provider'];

    // Determina o provider (do header ou do .env)
    let provider: DatabaseProvider;
    
    if (providerHeader) {
      const headerValue = providerHeader.toUpperCase();
      if (headerValue === 'PRISMA' || headerValue === 'DYNAMODB') {
        provider = headerValue as DatabaseProvider;
      } else {
        // Header inválido, usa padrão do .env
        const envProvider = process.env.DATABASE_PROVIDER?.toUpperCase();
        provider = (envProvider === 'DYNAMODB' ? 'DYNAMODB' : 'PRISMA') as DatabaseProvider;
      }
    } else {
      // Sem header, usa padrão do .env
      const envProvider = process.env.DATABASE_PROVIDER?.toUpperCase();
      provider = (envProvider === 'DYNAMODB' ? 'DYNAMODB' : 'PRISMA') as DatabaseProvider;
    }

    // SEMPRE cria contexto no AsyncLocalStorage, mesmo sem header
    return new Observable((subscriber) => {
      this.databaseContext.run(provider, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}

