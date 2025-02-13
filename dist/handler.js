"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
// handler.ts
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const serverless_http_1 = __importDefault(require("serverless-http"));
// Cache para armazenar a instância do servidor entre execuções Lambda
let cachedServer;
// Helper para tratamento seguro de mensagens de erro
function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    return String(error);
}
// Helper para logging detalhado de erros
function logError(error) {
    if (error instanceof Error) {
        console.error('Erro:', error.stack || error.message);
    }
    else {
        console.error('Erro desconhecido:', error);
    }
}
/**
 * Inicializa ou retorna a instância do servidor NestJS com Fastify
 * @returns Promise com o servidor configurado para uso no Lambda
 */
function bootstrapServer() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!cachedServer) {
            console.log('⚡ Inicializando o servidor NestJS...');
            const app = yield core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter({ logger: true }));
            app.enableCors({
                origin: '*',
                methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
            });
            yield app.init();
            cachedServer = (0, serverless_http_1.default)(app.getHttpAdapter().getInstance());
            console.log('✅ Servidor inicializado e pronto para requisições!');
        }
        return cachedServer;
    });
}
/**
 * Handler principal para execução no AWS Lambda
 */
const handler = (event, context) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const server = yield bootstrapServer();
        const response = yield server(event, context);
        response.headers = Object.assign(Object.assign({}, response.headers), { 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' });
        return response;
    }
    catch (error) {
        logError(error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Erro interno do servidor',
                details: process.env.NODE_ENV === 'development'
                    ? getErrorMessage(error)
                    : 'Contate o suporte técnico',
                timestamp: new Date().toISOString(),
                requestId: context.awsRequestId,
            }),
        };
    }
});
exports.handler = handler;
/**
 * Configuração para execução local
 */
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
    function bootstrapLocal() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('🚀 Iniciando servidor local...');
            const app = yield core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter());
            yield app.listen(3000, '0.0.0.0', () => {
                console.log(`🔌 Servidor ouvindo em http://localhost:3000`);
                console.log(`📚 Documentação Swagger em http://localhost:3000/api`);
            });
        });
    }
    bootstrapLocal().catch(error => {
        logError(error);
        process.exit(1);
    });
}
