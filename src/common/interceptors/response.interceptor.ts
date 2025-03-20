// src\common\interceptors\response.interceptor.ts
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * @class ResponseInterceptor
 * @description Interceptor global para padronização de respostas HTTP bem-sucedidas.
 * Formata a saída de todas as rotas para incluir um indicador de sucesso, os dados, um timestamp, o caminho da requisição e o código de status HTTP.
 * Também captura erros e os formata em uma estrutura de resposta de erro consistente.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    /**
     * @param context Contexto de execução da requisição. Contém informações sobre a requisição e a resposta.
     * @param next Próximo manipulador na cadeia de execução. Representa o método do controlador que será executado.
     * @returns Um Observable que emite a resposta formatada.
     */
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
        return next.handle().pipe(
            map((data: T) => this.formatSuccessResponse(data, context)),
            catchError((err: HttpException | Error) => this.formatErrorResponse(err))
        );
    }

    /**
     * @private
     * @param payload Os dados da resposta a serem formatados. O tipo `T` é genérico e representa o tipo dos dados.
     * @param context Contexto de execução da requisição. Usado para acessar informações sobre a requisição.
     * @returns Um objeto `ApiResponse` contendo os dados formatados.
     */
    private formatSuccessResponse(payload: T, context: ExecutionContext): ApiResponse<T> {
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest<Request>();
        const response = httpContext.getResponse();

        return {
            success: true,
            data: payload,
            timestamp: new Date().toISOString(),
            path: request.url,
            statusCode: response.statusCode,
        };
    }

    /**
     * @private
     * @param error O objeto de erro capturado. Pode ser uma instância de `HttpException` ou um erro genérico.
     * @returns Um Observable que emite uma estrutura de erro padronizada usando `throwError`.
     */
    private formatErrorResponse(error: HttpException | Error): Observable<never> {
        const statusCode = (error instanceof HttpException) ? error.getStatus() : 500;
        const message = error.message || 'Erro interno do servidor';
        const errorResponse = (error instanceof HttpException) ? error.getResponse() : undefined;
        // Usando unknown em vez de any, pois não sabemos a estrutura exata de details
        const errorDetails = (typeof errorResponse === 'object' && errorResponse !== null && 'details' in errorResponse) ? (errorResponse as { details?: unknown }).details : undefined;

        return throwError(() => ({
            success: false,
            statusCode,
            message,
            timestamp: new Date().toISOString(),
            errorDetails,
        }));
    }
}

/**
 * @interface ApiResponse
 * @description Interface que define a estrutura padrão para respostas da API.
 * @template T O tipo dos dados da resposta.
 */
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    timestamp: string;
    path: string;
    statusCode: number;
}