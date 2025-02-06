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
let cachedServer; // Cache da instância do servidor
/**
 * Inicializa o servidor NestJS com Fastify para melhorar performance.
 */
function bootstrapServer() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!cachedServer) {
            console.log('⚡ Inicializando o servidor NestJS...');
            const app = yield core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter());
            app.enableCors(); // Ativa CORS, se necessário
            yield app.init();
            cachedServer = (0, serverless_http_1.default)(app.getHttpAdapter().getInstance()); // Adapta para AWS Lambda
            console.log('✅ Servidor pronto!');
        }
        return cachedServer;
    });
}
/**
 * Handler AWS Lambda: Executado a cada requisição
 */
const handler = (event, context) => __awaiter(void 0, void 0, void 0, function* () {
    const server = yield bootstrapServer();
    return server(event, context);
});
exports.handler = handler;
/**
 * Se não estiver rodando no AWS Lambda, inicializa o servidor localmente
 */
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
    function bootstrapLocal() {
        return __awaiter(this, void 0, void 0, function* () {
            const app = yield core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter());
            yield app.listen(3000);
            console.log('🚀 Servidor rodando em http://localhost:3000');
        });
    }
    bootstrapLocal();
}
