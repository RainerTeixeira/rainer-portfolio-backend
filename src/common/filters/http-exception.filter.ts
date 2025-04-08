// src/common/filters/http-exception.filter.ts
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify'; // Importa FastifyReply para compatibilidade com Fastify

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<FastifyReply>(); // Usa FastifyReply para compatibilidade
        const request = ctx.getRequest();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Erro interno do servidor';
        let errorDetails: { name?: string; stack?: string; [key: string]: unknown } | null = null;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const errorResponse = exception.getResponse();
            if (typeof errorResponse === 'string') {
                message = errorResponse;
            } else if (typeof errorResponse === 'object' && errorResponse !== null) {
                const typedErrorResponse = errorResponse as { message?: string; details?: Record<string, unknown> };
                message = typedErrorResponse.message || message;
                errorDetails = typedErrorResponse.details || null;
            }
        } else if (exception instanceof Error) {
            message = exception.message;
            errorDetails = { name: exception.name, stack: exception.stack };
        }

        this.logger.error(
            `HTTP Exception: ${message}`,
            exception instanceof Error ? exception.stack : undefined,
        );

        response.status(status).send({
            success: false,
            metadata: {
                timestamp: new Date().toISOString(),
                path: request.url,
                statusCode: status,
            },
            message,
            ...(errorDetails && { errorDetails }),
        });
    }
}
