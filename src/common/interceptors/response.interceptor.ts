// response.interceptor.ts
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * @class ResponseInterceptor
 * @description Interceptor global para padronização de respostas HTTP bem-sucedidas
 * @implements NestInterceptor
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    /**
     * Método principal para interceptar e transformar respostas
     * @param context Contexto de execução da requisição
     * @param next Próximo manipulador na cadeia de execução
     * @returns Observable com resposta formatada
     */
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map(data => this.formatSuccessResponse(data, context)),
            catchError(err => this.formatErrorResponse(err))
        );
    }

    /**
     * Formata respostas de sucesso
     * @param payload Dados da resposta
     * @param context Contexto de execução
     * @returns Objeto de resposta padronizado
     */
    private formatSuccessResponse(payload: any, context: ExecutionContext) {
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest<Request>();

        return {
            success: true,
            data: payload,
            timestamp: new Date().toISOString(),
            path: request.url,
            statusCode: httpContext.getResponse().statusCode,
        };
    }

    /**
     * Formata respostas de erro
     * @param error Objeto de erro capturado
     * @returns Observable com erro formatado
     */
    private formatErrorResponse(error: any) {
        const statusCode = error.status || 500;
        const message = error.message || 'Erro interno do servidor';

        return throwError(() => ({
            success: false,
            statusCode,
            message,
            timestamp: new Date().toISOString(),
            errorDetails: error.response?.details || undefined,
        }));
    }
}