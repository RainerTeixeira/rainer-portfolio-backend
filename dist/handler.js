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
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const serverless_http_1 = __importDefault(require("serverless-http"));
// Variável para armazenar em cache a instância do servidor NestJS para otimizar cold starts.
// 'cachedServer' mantém a instância do servidor entre invocações da Lambda, evitando reinicializações desnecessárias.
let cachedServer;
/**
 * Função auxiliar para obter a mensagem de erro de forma segura.
 * Garante que sempre retornemos uma string, mesmo que o erro não seja uma instância de Error.
 * @param error Objeto de erro desconhecido.
 * @returns string Mensagem de erro tratada.
 */
function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message; // Se for um objeto Error, retorna a mensagem padrão.
    return String(error); // Caso contrário, converte o erro para string (segurança contra tipos inesperados).
}
/**
 * Função auxiliar para logar erros de forma detalhada no console.
 * Ajuda no debugging, especialmente em ambiente Lambda, onde logs são cruciais.
 * @param error Objeto de erro desconhecido.
 */
function logError(error) {
    if (error instanceof Error) {
        // Se for um objeto Error, loga a mensagem e o stacktrace (se disponível).
        console.error('Erro:', error.stack || error.message);
    }
    else {
        // Se for um erro desconhecido, loga uma mensagem genérica.
        console.error('Erro desconhecido:', error);
    }
}
/**
 * Função assíncrona para inicializar ou retornar a instância cached do servidor NestJS com Fastify.
 * O padrão de "cache" aqui é fundamental para performance em ambiente Lambda, minimizando cold starts.
 * @returns Promise<any> Promise que resolve com o servidor NestJS configurado para Lambda.
 */
function bootstrapServer() {
    return __awaiter(this, void 0, void 0, function* () {
        // Verifica se já existe uma instância cached do servidor.
        if (!cachedServer) {
            console.log('⚡ Inicializando o servidor NestJS...'); // Loga o início da inicialização.
            // Cria a aplicação NestJS usando Fastify como adaptador HTTP para alta performance.
            const app = yield core_1.NestFactory.create(app_module_1.AppModule, // Módulo raiz da aplicação NestJS.
            new platform_fastify_1.FastifyAdapter({ logger: true }));
            // Habilita CORS para permitir requisições de diferentes origens (configurado para permitir todas as origens neste exemplo - ajuste conforme necessário em produção).
            app.enableCors({
                origin: '*', // Permite requisições de qualquer origem.
                methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos HTTP permitidos.
            });
            // Inicializa a aplicação NestJS.
            yield app.init();
            // Cria um servidor "serverless" a partir da instância do Fastify, utilizando a biblioteca 'serverless-http'.
            // Esse servidor serverless é compatível com o formato de eventos do AWS Lambda e API Gateway.
            cachedServer = (0, serverless_http_1.default)(app.getHttpAdapter().getInstance());
            console.log('✅ Servidor inicializado e pronto para requisições!'); // Loga o sucesso na inicialização.
        }
        // Retorna a instância cached do servidor (seja a nova ou a existente).
        return cachedServer;
    });
}
/**
 * Handler principal para AWS Lambda. Recebe eventos do API Gateway e contexto de execução do Lambda.
 * É o ponto de entrada da função Lambda na AWS.
 * @param event Objeto de evento do API Gateway, contendo detalhes da requisição HTTP.
 * @param context Objeto de contexto do AWS Lambda, com informações sobre o ambiente de execução.
 * @returns Promise<any> Promise que resolve com a resposta HTTP formatada para o API Gateway.
 */
const handler = (event, // Evento do API Gateway.
context // Contexto do Lambda.
) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Obtém a instância do servidor (inicializando-o se for a primeira invocação - cold start).
        const server = yield bootstrapServer();
        // Processa a requisição HTTP usando o servidor serverless cached.
        const response = yield server(event, context);
        // Adiciona headers de segurança à resposta para reforçar a segurança da aplicação.
        response.headers = Object.assign(Object.assign({}, response.headers), { 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' });
        // Retorna a resposta formatada para o API Gateway.
        return response;
    }
    catch (error) {
        // Em caso de erro não capturado durante o processamento da requisição:
        logError(error); // Loga o erro detalhadamente.
        // Retorna uma resposta de erro HTTP 500 (Internal Server Error) para o cliente.
        return {
            statusCode: 500, // Código de status HTTP 500.
            headers: {
                'Content-Type': 'application/json', // Define o tipo de conteúdo da resposta como JSON.
            },
            body: JSON.stringify({
                message: 'Erro interno do servidor', // Mensagem de erro genérica para o cliente.
                details: process.env.NODE_ENV === 'development' // Inclui detalhes do erro (stacktrace) apenas em ambiente de desenvolvimento para não expor informações sensíveis em produção.
                    ? getErrorMessage(error) // Em desenvolvimento, retorna a mensagem de erro detalhada.
                    : 'Contate o suporte técnico', // Em produção, retorna uma mensagem amigável e genérica.
                timestamp: new Date().toISOString(), // Adiciona um timestamp para rastreamento do erro.
                requestId: context.awsRequestId, // Inclui o ID da requisição da AWS para facilitar o rastreamento nos logs da AWS.
            }),
        };
    }
});
exports.handler = handler;
/**
 * Bloco de código para execução local da aplicação NestJS (fora do ambiente Lambda).
 * Este bloco só é executado se a variável de ambiente AWS_LAMBDA_FUNCTION_NAME não estiver definida,
 * indicando que não estamos rodando dentro do AWS Lambda.
 */
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
    function bootstrapLocal() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('🚀 Iniciando servidor local... - Passo 1: Inicio da funcao bootstrapLocal'); // LOG PASS0 1
            console.log('🚀 Iniciando servidor local...'); // Loga o início do servidor local.
            console.log('🚀 Iniciando servidor local... - Passo 2: Criando a aplicacao NestFactory'); // LOG PASS0 2
            // Cria a aplicação NestJS usando Fastify como adaptador HTTP (sem logging detalhado para ambiente local - pode ser ajustado).
            const app = yield core_1.NestFactory.create(app_module_1.AppModule, // Módulo raiz da aplicação.
            new platform_fastify_1.FastifyAdapter());
            console.log('🚀 Iniciando servidor local... - Passo 3: Aplicacao NestFactory Criada'); // LOG PASS0 3
            console.log('🚀 Iniciando servidor local... - Passo 4: Iniciando o listen'); // LOG PASS0 4
            // Inicia o servidor local na porta 3000 e no endereço 0.0.0.0 (acessível externamente).
            yield app.listen(3000, '0.0.0.0', () => {
                console.log('🚀 Iniciando servidor local... - Passo 5: Listen Iniciado - Callback'); // LOG PASS0 5
                console.log(`🔌 Servidor ouvindo em http://localhost:3000`); // Loga o endereço do servidor local.
                console.log(`📚 Documentação Swagger em http://localhost:3000/api`); // Loga o endereço da documentação Swagger (se configurada).
            });
            console.log('🚀 Iniciando servidor local... - Passo 6: Listen Iniciado - Fora do Callback'); // LOG PASS0 6
        });
    }
    // Inicializa o servidor local e trata possíveis erros durante a inicialização.
    bootstrapLocal().catch(error => {
        console.log('🚀 Iniciando servidor local... - Passo ERRO: Dentro do Catch'); // LOG PASS0 ERRO - CATCH
        logError(error); // Loga qualquer erro que ocorra durante a inicialização do servidor local.
        process.exit(1); // Encerra o processo Node.js em caso de falha na inicialização.
    });
}
