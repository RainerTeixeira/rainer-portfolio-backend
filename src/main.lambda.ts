import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Context as LambdaContext, APIGatewayProxyEvent as LambdaEvent } from 'aws-lambda';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import serverless from 'serverless-http';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { FastifyInstance } from 'fastify';

/**
 * Instância do servidor empacotado para Lambda, armazenada em cache para otimização.
 * @type {ReturnType<typeof serverless> | null}
 */
let cachedServer: ReturnType<typeof serverless> | null = null;

/**
 * Registra erros no console, diferenciando entre erros do tipo `Error` e outros tipos.
 * @param {unknown} error - O erro a ser registrado.
 */
function logError(error: unknown): void {
  if (error instanceof Error) {
    console.error('[ERRO CRÍTICO]', error.stack || error.message);
  } else {
    console.error('[ERRO DESCONHECIDO]', error);
  }
}

/**
 * Configura o Swagger para documentação da API.
 * @async
 * @param {NestFastifyApplication} app - A instância da aplicação NestJS.
 */
async function setupSwagger(app: NestFastifyApplication) {
  const configService = app.get(ConfigService);

  const config = new DocumentBuilder()
    .setTitle('API Portfolio Rainer Teixeira')
    .setDescription('API profissional para gerenciamento de conteúdo do portfólio')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Insira o token JWT do Cognito',
      },
      'cognito-auth',
    )
    .addServer(configService.get('API_BASE_URL', 'http://localhost:4000'))
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      oauth2RedirectUrl: `${configService.get('COGNITO_DOMAIN')}/oauth2/authorize`,
    },
  });
}

/**
 * Configura e inicializa a aplicação NestJS para execução em Lambda.
 * @async
 * @returns {Promise<ReturnType<typeof serverless>>} - Uma promessa que resolve com o servidor empacotado.
 */
async function bootstrapServer(): Promise<ReturnType<typeof serverless>> {
  if (!cachedServer) {
    // Cria a aplicação utilizando o adaptador Fastify
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter({
        logger: process.env.NODE_ENV === 'development',
        trustProxy: true,
      }),
    );

    const configService = app.get(ConfigService);

    // Validação de configuração crítica: Verifica se o Cognito está configurado
    if (!configService.get('COGNITO_USER_POOL_ID')) {
      throw new Error('Configuração do Cognito não encontrada!');
    }

    // Configuração de CORS para ambiente Lambda
    // Nota: Quando 'credentials' é true, é recomendado especificar explicitamente os domínios.
    app.enableCors({
      origin: configService.get('CORS_ORIGIN', '*'),
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });

    // Validação global de DTOs (Data Transfer Objects)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    // Configuração do Swagger para documentação da API
    await setupSwagger(app);

    // Inicializa a aplicação de forma segura
    await app.init();

    // Log de configurações importantes
    console.log('🔐 Configuração Cognito:');
    console.log(`- User Pool ID: ${configService.get('COGNITO_USER_POOL_ID')}`);
    console.log(`- Região AWS: ${configService.get('AWS_REGION')}`);

    // Cria a instância do serverless para uso com AWS Lambda
    cachedServer = serverless(app.getHttpAdapter().getInstance() as unknown as FastifyInstance, {
      binary: ['image/*', 'application/pdf'],
    });
  }

  return cachedServer;
}

/**
 * Handler principal para eventos do AWS Lambda.
 * @async
 * @param {LambdaEvent} event - O evento do Lambda.
 * @param {LambdaContext} context - O contexto do Lambda.
 * @returns {Promise<any>} - Uma promessa que resolve com a resposta do servidor.
 */
export const handler = async (event: LambdaEvent, context: LambdaContext) => {
  try {
    const server = await bootstrapServer();
    return await server(event, context);
  } catch (error) {
    logError(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erro interno do servidor' }),
    };
  }
};

// Se não estiver rodando em ambiente AWS Lambda, executa a aplicação localmente.
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  /**
   * Configura e inicializa a aplicação NestJS para execução local.
   * @async
   */
  async function bootstrapLocal() {
    // Cria a aplicação utilizando o adaptador Fastify
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter({
        logger: true,
        https:
          process.env.NODE_ENV === 'production'
            ? {
              key: process.env.SSL_KEY,
              cert: process.env.SSL_CERT,
            }
            : undefined,
      }),
    );

    const configService = app.get(ConfigService);

    // Aviso de segurança: Verifica se o Client ID do Cognito está configurado para ambiente local
    if (!configService.get('COGNITO_CLIENT_ID')) {
      console.warn('⚠️ Aviso: Client ID do Cognito não configurado!');
    }

    // Configuração de CORS para ambiente local
    app.enableCors({
      origin: configService.get('CORS_ORIGIN', '*'),
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });

    // Configuração do Swagger para documentação da API
    await setupSwagger(app);

    // Inicia a aplicação localmente na porta definida (ou 4000 por padrão)
    await app.listen(configService.get('PORT', 4000), '0.0.0.0', async () => {
      console.log(`🚀 Servidor local em ${await app.getUrl()}`);
      console.log(`📚 Swagger: ${await app.getUrl()}/api`);
    });
  }

  // Inicializa o ambiente local e trata possíveis erros
  bootstrapLocal().catch((error) => {
    logError(error);
    process.exit(1);
  });
}
