// src/common/interceptors/response.interceptor.ts

import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpException,
} from '@nestjs/common';
// Importa o tipo Request do express para tipagem correta
import { Request } from 'express';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * @interface ApiResponse
 * @description Estrutura padrão para todas as respostas da API, tanto sucesso quanto erro (embora o formato de erro possa variar ligeiramente).
 * Define os campos comuns esperados em uma resposta padronizada.
 */
interface ApiResponse<T> {
    /** Indica se a operação foi bem-sucedida. */
    success: boolean;
    /** Os dados retornados pela operação em caso de sucesso. Opcional. */
    data?: T;
    /** Timestamp ISO 8601 de quando a resposta foi gerada. */
    timestamp: string;
    /** O caminho (URL) da requisição original que gerou esta resposta. */
    path: string;
    /** O código de status HTTP da resposta. */
    statusCode: number;
    /** Mensagem descritiva, especialmente útil em caso de erro. */
    message?: string;
    /** Detalhes adicionais do erro, se houver. */
    errorDetails?: unknown;
}

/**
 * @class ResponseInterceptor
 * @description Interceptor global do NestJS que padroniza todas as respostas de sucesso e erro da API.
 * Ele intercepta as respostas dos controllers e as encapsula em um formato unificado (`ApiResponse`)
 * antes de enviá-las ao cliente, adicionando metadados úteis como timestamp, path e status code.
 * Também captura exceções (HttpException ou Erros genéricos) e as formata em um padrão de erro consistente.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    /**
     * @method intercept
     * @description Método principal do interceptor, chamado pelo NestJS para cada requisição.
     * Ele "ouve" o stream de resposta (`next.handle()`) e aplica transformações.
     * Usa `map` para formatar respostas de sucesso e `catchError` para formatar erros.
     * @param context O contexto de execução da requisição atual (contém request, response, etc.).
     * @param next O manipulador que permite continuar o fluxo da requisição/resposta.
     * @returns Um Observable que emitirá a resposta formatada (ApiResponse) ou lançará um erro formatado.
     */
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
        return next.handle().pipe(
            // Mapeia a resposta de sucesso para o formato padronizado
            map((data: T) => this.formatSuccessResponse(data, context)),
            // Captura qualquer erro ocorrido no stream e o formata
            catchError((err: HttpException | Error) => this.formatErrorResponse(err, context)) // Passa context para obter path no erro, se necessário
        );
    }

    /**
     * @method formatSuccessResponse
     * @description Formata uma resposta bem-sucedida, encapsulando os dados originais (`payload`)
     * dentro da estrutura `ApiResponse`. Adiciona metadados como success=true, timestamp, path e statusCode.
     * Inclui uma verificação para evitar re-formatação se a resposta já estiver no formato `ApiResponse` completo.
     * @param payload Os dados retornados pelo controller.
     * @param context O contexto de execução para obter informações da requisição (URL) e resposta (status code).
     * @returns O objeto de resposta padronizado `ApiResponse<T>`.
     */
    private formatSuccessResponse(payload: T, context: ExecutionContext): ApiResponse<T> {
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest<Request>(); // Obtém o objeto Request
        const response = httpContext.getResponse();       // Obtém o objeto Response

        // Verifica se o payload já parece ser uma ApiResponse completa para evitar formatação duplicada.
        // Isso é útil se algum serviço/controller já retornar a estrutura padronizada.
        if (
            typeof payload === 'object' &&
            payload !== null &&
            'success' in payload &&
            'data' in payload &&
            'timestamp' in payload &&
            'statusCode' in payload &&
            'path' in payload // <-- CORREÇÃO: Verifica também a existência de 'path'
        ) {
            // Se já tem todas as chaves, incluindo 'path', assume que já está formatado.
            return payload as ApiResponse<T>;
        }

        // Se não estiver formatado, cria a estrutura padrão de sucesso.
        return {
            success: true,
            statusCode: response.statusCode, // Pega o status code definido no controller/NestJS
            timestamp: new Date().toISOString(),
            path: request.url, // Pega a URL da requisição atual
            data: payload, // Os dados originais retornados pelo controller
        };
    }

    /**
     * @method formatErrorResponse
     * @description Formata um erro (HttpException ou Error genérico) em uma estrutura `ApiResponse` padronizada.
     * Extrai status code, mensagem e detalhes do erro original.
     * @param error O erro capturado (pode ser HttpException ou um Error padrão).
     * @param context O contexto de execução para obter o path da requisição original.
     * @returns Um Observable que emite o erro formatado usando `throwError` do RxJS.
     */
    private formatErrorResponse(error: HttpException | Error, context: ExecutionContext): Observable<never> {
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest<Request>();

        const statusCode = error instanceof HttpException ? error.getStatus() : 500; // Padrão 500 para erros não-HTTP
        const message = error.message || 'Erro interno do servidor';

        // Tenta extrair detalhes adicionais se for uma HttpException com corpo de resposta estruturado
        const errorResponse = error instanceof HttpException ? error.getResponse() : undefined;
        const errorDetails =
            typeof errorResponse === 'object' && errorResponse !== null && 'message' in errorResponse // NestJS geralmente coloca a mensagem ou array de mensagens aqui
                ? errorResponse.message // Pega a(s) mensagem(ns) de validação, por exemplo
                : (typeof errorResponse === 'string' ? errorResponse : undefined); // Ou pega a string se for o caso


        // Cria o objeto de erro padronizado
        const formattedError: ApiResponse<null> = { // Usa null como tipo de dado para erro
            success: false,
            statusCode,
            message: typeof errorDetails === 'string' && errorDetails !== message ? errorDetails : message, // Usa detalhes como msg principal se for string e diferente
            timestamp: new Date().toISOString(),
            path: request.url, // Inclui o path também no erro
            errorDetails: typeof errorDetails !== 'string' ? errorDetails : undefined, // Inclui detalhes se não forem a mensagem principal
            data: null, // Garante que data seja null ou omitido no erro
        };

        // Usa throwError do RxJS para propagar o erro formatado no stream Observable
        // O NestJS irá capturar isso e enviar como resposta HTTP de erro.
        return throwError(() => new HttpException(formattedError, statusCode));
        // É comum re-lançar como HttpException para garantir que o NestJS trate corretamente o status code
    }
}