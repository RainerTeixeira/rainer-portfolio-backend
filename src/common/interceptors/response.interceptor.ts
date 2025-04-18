// src/common/interceptors/response.interceptor.ts

import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpException,
    HttpStatus, // Importar HttpStatus para códigos padrão
} from '@nestjs/common';
import { Request, Response } from 'express'; // Importar Response do Express
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid'; // Para um ID de requisição/erro
import { ApiExtraModels } from '@nestjs/swagger'; // Importar ApiExtraModels

/**
 * @interface ApiResponseMetadata
 * @description Metadados incluídos em cada resposta da API para rastreabilidade e informação.
 */
interface ApiResponseMetadata {
    /** Timestamp ISO 8601 de quando a resposta foi gerada. */
    readonly timestamp: string;
    /** O caminho (URL) da requisição original que gerou esta resposta. */
    readonly path: string;
    /** O código de status HTTP da resposta. */
    readonly statusCode: number;
    /** Um ID único para rastrear esta requisição/resposta específica. */
    readonly requestId: string;
}

/**
 * @interface ApiSuccessResponse
 * @description Estrutura padrão para respostas de sucesso da API.
 */
export interface ApiSuccessResponse<T> {
    /** Sempre `true` para indicar sucesso. */
    readonly success: true;
    /** Metadados da resposta. */
    readonly metadata: ApiResponseMetadata;
    /** Os dados retornados pela operação. Pode ser qualquer tipo. */
    readonly data: T;
}

export class ApiSuccessResponseClass<T> implements ApiSuccessResponse<T> {
    success: true;
    metadata: ApiResponseMetadata;
    data: T;
}

/**
 * @interface ApiErrorResponse
 * @description Estrutura padrão para respostas de erro da API.
 */
interface ApiErrorResponse {
    /** Sempre `false` para indicar erro. */
    readonly success: false;
    /** Metadados da resposta (incluindo o status code do erro). */
    readonly metadata: ApiResponseMetadata;
    /** Mensagem principal descrevendo o erro. */
    readonly message: string;
    /** Código de erro interno ou específico da aplicação (opcional). */
    readonly errorCode?: string;
    /** Detalhes adicionais do erro (ex: erros de validação). */
    readonly errorDetails?: unknown;
}

/**
 * @class ResponseInterceptor
 * @description Interceptor global que padroniza TODAS as respostas da API (sucesso e erro).
 * Garante uma estrutura consistente com metadados essenciais para todas as respostas enviadas ao cliente.
 * Separa claramente a estrutura da resposta dos dados retornados pela lógica de negócio (controllers/services).
 */
@ApiExtraModels(ApiSuccessResponseClass) // Registrar o modelo no Swagger
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {

    /**
     * @method intercept
     * @description Intercepta o fluxo de resposta. Aplica formatação de sucesso via `map`
     * e formatação de erro via `catchError`.
     * @param context Contexto de execução atual.
     * @param next Manipulador para continuar o fluxo.
     * @returns Observable com a resposta final formatada (ApiSuccessResponse) ou um erro formatado (ApiErrorResponse via HttpException).
     */
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiSuccessResponse<T>> {
        const requestId = uuidv4(); // Gera um ID único para esta requisição
        const now = new Date().toISOString();
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest<Request>();
        const response = httpContext.getResponse<Response>();

        return next.handle().pipe(
            map((data: T) => this.formatSuccessResponse(data, request, response, now, requestId)),
            catchError((err: HttpException | Error) => this.formatErrorResponse(err, request, now, requestId))
        );
    }

    /**
     * @method formatSuccessResponse
     * @description Formata uma resposta de sucesso. SEMPRE envolve os dados retornados pelo controller
     * na estrutura padronizada `ApiSuccessResponse`, adicionando metadados.
     * @param payload Os dados brutos retornados pelo controller/service.
     * @param request Objeto Request para obter o URL.
     * @param response Objeto Response para obter o status code final.
     * @param timestamp Timestamp da interceptação.
     * @param requestId ID único da requisição.
     * @returns Objeto `ApiSuccessResponse<T>` formatado.
     */
    private formatSuccessResponse(payload: T, request: Request, response: Response, timestamp: string, requestId: string): ApiSuccessResponse<T> {
        const statusCode = response.statusCode || HttpStatus.OK; // Corrigido para usar response.statusCode corretamente

        return {
            success: true,
            metadata: {
                timestamp,
                path: request.url,
                statusCode,
                requestId,
            },
            data: payload,
        };
    }

    /**
     * @method formatErrorResponse
     * @description Formata um erro capturado (HttpException ou Error genérico) na estrutura `ApiErrorResponse`.
     * Extrai informações relevantes do erro e as encapsula no formato padrão.
     * Relança o erro formatado como uma HttpException para o NestJS tratar corretamente.
     * @param error O erro capturado.
     * @param request Objeto Request para obter o URL.
     * @param timestamp Timestamp da interceptação.
     * @param requestId ID único da requisição.
     * @returns Observable que emite o erro formatado (`never` pois lança exceção).
     */
    private formatErrorResponse(error: HttpException | Error, request: Request, timestamp: string, requestId: string): Observable<never> {
        let statusCode: number;
        let message: string;
        let errorCode: string | undefined;
        let errorDetails: Record<string, unknown> | undefined; // Ajustado para garantir compatibilidade

        if (error instanceof HttpException) {
            statusCode = error.getStatus();
            const errorResponse = error.getResponse();
            if (typeof errorResponse === 'string') {
                message = errorResponse;
            } else if (typeof errorResponse === 'object' && errorResponse !== null) {
                message = (errorResponse as Record<string, unknown>).message as string || error.message || 'Erro inesperado';
                errorDetails = (errorResponse as Record<string, unknown>).details as Record<string, unknown> || undefined; // Corrigido para garantir compatibilidade
                errorCode = (errorResponse as Record<string, unknown>).errorCode as string;
            } else {
                message = error.message || 'Erro inesperado';
            }
        } else {
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Erro interno do servidor';
            errorDetails = error instanceof Error ? { name: error.name, stack: error.stack } : undefined;
            this.logInternalError(error, request, requestId);
        }

        const formattedError: ApiErrorResponse = {
            success: false,
            metadata: {
                timestamp,
                path: request.url,
                statusCode,
                requestId,
            },
            message,
            ...(errorCode && { errorCode }),
            ...(errorDetails ? { errorDetails } : {}),
        };

        return throwError(() => new HttpException(formattedError, statusCode));
    }

    /**
     * @method logInternalError
     * @description Loga erros inesperados (não-HttpException) para depuração.
     * @param error O erro original.
     * @param request Objeto Request.
     * @param requestId ID da requisição.
     */
    private logInternalError(error: unknown, request: Request, requestId: string): void {
        console.error(
            `[Internal Server Error] RequestID: ${requestId}, Path: ${request.url}, Method: ${request.method}`,
            error instanceof Error ? error.stack : error
        );
    }
}