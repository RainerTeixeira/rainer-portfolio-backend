import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * @file Interceptor de resposta para o backend do portfólio de Rainer.
 * 
 * Este interceptor é responsável por modificar a resposta de todas as requisições HTTP
 * feitas ao servidor, adicionando informações adicionais e padronizando o formato da resposta.
 */

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    /**
     * Intercepta a resposta da requisição e modifica seu formato.
     * 
     * @param context - O contexto da execução que contém detalhes sobre a requisição atual.
     * @param next - O manipulador que continua o fluxo da requisição.
     * @returns Um Observable que emite a resposta modificada.
     */
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map(data => this.formatResponse(data, context)),
            catchError(error => this.formatErrorResponse(error))
        );
    }

    /**
     * Formata a resposta de sucesso.
     * 
     * @param data - Os dados da resposta original.
     * @param context - O contexto da execução que contém detalhes sobre a requisição atual.
     * @returns Um objeto contendo a resposta formatada.
     */
    private formatResponse(data: any, context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        return {
            success: true,
            data,
            timestamp: new Date().toISOString(),
            path: request.url,
        };
    }

    /**
     * Formata a resposta de erro.
     * 
     * @param error - O erro capturado.
     * @returns Um Observable que emite a resposta de erro formatada.
     */
    private formatErrorResponse(error: any) {
        return throwError(() => ({
            success: false,
            error: error.response?.message || error.message,
            statusCode: error.status,
            timestamp: new Date().toISOString(),
        }));
    }
}
