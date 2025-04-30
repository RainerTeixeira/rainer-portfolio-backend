import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Context, LambdaFunctionURLEvent } from 'aws-lambda'; // Correção aqui: LambdaFunctionUrlEvent (com 'l' minúsculo)
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { FastifyInstance, fastify } from 'fastify';
import { ApiSuccessResponseClass } from '@src/common/interceptors/response.interceptor'; // Importa o modelo
import fastifyCompress from '@fastify/compress';

// Define um tipo customizado para a resposta do inject
interface InjectResponse {
  statusCode: number;
  headers: Record<string, string | string[]>;
  body: string;
}

let cachedFastify: FastifyInstance | null = null;

// Função de inicialização do Fastify
/**
 * Inicializa uma instância do Fastify com as configurações necessárias para a API.
 * Registra o middleware de compressão e a configuração de CORS.
 * Habilita a documentação do Swagger quando não estiver em ambiente AWS Lambda.
 * 
 * @returns {Promise<FastifyInstance>} Instância do Fastify inicializada.
 */
async function bootstrapFastify(): Promise<FastifyInstance> {
  if (!cachedFastify) {
    const instance = fastify({
      logger: process.env.NODE_ENV === 'development', // Logger ativo em modo desenvolvimento
      trustProxy: true, // Confiança em proxy (usado para correção de IP real)
    });

    await instance.register(fastifyCompress); // Ativa compressão HTTP para melhorar o desempenho

    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter(instance),
    );

    const configService = app.get(ConfigService);

    // Configuração de CORS (Cross-Origin Resource Sharing) 
    app.enableCors({
      origin: configService.get('CORS_ORIGIN', '*'), // Origem permitida configurada via variável de ambiente
      methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos HTTP permitidos
      allowedHeaders: ['Content-Type', 'Authorization'], // Cabeçalhos permitidos
    });

    // Habilita a validação global de entrada de dados
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })
    );

    // Configuração do Swagger (documentação da API)
    if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
      const swaggerConfig = new DocumentBuilder()
        .setTitle('API Portfolio') // Título da API
        .setDescription('Documentação da API de Portfólio') // Descrição da API
        .setVersion('1.0') // Versão da API
        .build();

      const document = SwaggerModule.createDocument(app, swaggerConfig, {
        extraModels: [ApiSuccessResponseClass], // Registra o modelo extra para a resposta de sucesso
      });

      // Configura o Swagger para ser acessado na rota '/api'
      SwaggerModule.setup('api', app, document);
    }

    // Inicializa a aplicação
    await app.init();
    cachedFastify = instance; // Armazena a instância do Fastify
  }
  return cachedFastify;
}

// Função que é invocada como handler na AWS Lambda
/**
 * Função que será chamada na AWS Lambda para processar as requisições.
 * Ele inicializa o Fastify, injeta a requisição, processa e retorna a resposta.
 * 
 * @param {LambdaFunctionURLEvent} event - Evento da AWS Lambda com dados da requisição
 * @returns {Promise<{ statusCode: number, headers: Record<string, string>, body: string }>} Resposta formatada
 */
export const lambdaHandler = async (event: LambdaFunctionURLEvent) => {
  const fastifyInstance = await bootstrapFastify(); // Inicializa o Fastify

  // Definindo os métodos HTTP válidos
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const;
  type ValidMethod = typeof validMethods[number];

  // Determina o método HTTP da requisição a partir do evento
  const method = (event.requestContext?.http?.method ?? 'GET').toUpperCase();
  const safeMethod: ValidMethod = validMethods.includes(method as ValidMethod) ? method as ValidMethod : 'GET';

  // Força a tipagem para a resposta da injeção de requisição
  const response = (await fastifyInstance.inject({
    method: safeMethod, // Método HTTP da requisição
    url: event.rawPath, // Caminho da URL da requisição
    headers: event.headers || {}, // Cabeçalhos da requisição
    payload: event.body || undefined, // Corpo da requisição
  })) as unknown as InjectResponse;

  // Retorna a resposta da requisição
  return {
    statusCode: response.statusCode || 500, // Código de status HTTP
    headers: response.headers, // Cabeçalhos da resposta
    body: response.body || '', // Corpo da resposta
  };
};

// Bloco de inicialização local, se não estiver em ambiente AWS Lambda
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  (async () => {
    const fastifyInstance = await bootstrapFastify(); // Inicializa o Fastify
    fastifyInstance.listen(
      { port: 4000, host: '0.0.0.0' }, // Inicia o servidor local na porta 4000
      (err, address) => {
        if (err) {
          console.error(err); // Log de erro, caso aconteça
          process.exit(1); // Encerra o processo em caso de erro
        }
        console.log(`Servidor local: ${address}/api`); // Log de sucesso com endereço local
      }
    );
  })();
}
