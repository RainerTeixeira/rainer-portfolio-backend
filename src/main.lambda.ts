import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Context as LambdaContext, APIGatewayProxyEvent as LambdaEvent } from 'aws-lambda';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import serverless from 'serverless-http';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // Importe os módulos do Swagger UI

// Variável para armazenar em cache a instância do servidor NestJS para otimizar cold starts.
// 'cachedServer' mantém a instância do servidor entre invocações da Lambda, evitando reinicializações desnecessárias.
let cachedServer: ReturnType<typeof serverless> | null = null;

/**
 * Função auxiliar para logar erros de forma detalhada no console.
 * Ajuda no debugging, especialmente em ambiente Lambda, onde logs são cruciais.
 * @param error Objeto de erro desconhecido.
 */
function logError(error: unknown): void {
  if (error instanceof Error) {
    // Se for um objeto Error, loga a mensagem e o stacktrace (se disponível).
    console.error('Erro:', error.stack || error.message);
  } else {
    // Se for um erro desconhecido, loga uma mensagem genérica.
    console.error('Erro desconhecido:', error);
  }
}

async function setupSwagger(app: NestFastifyApplication) {
  const config = new DocumentBuilder()
    .setTitle('API do Rainer Portfolio') // Título da documentação no Swagger UI
    .setDescription('API Backend para o Portfólio do Rainer Teixeira') // Descrição da API
    .setVersion('1.0') // Versão da API
    .addTag('portfolio') // Tag para agrupar as rotas (opcional)
    .build(); // Finaliza a configuração do DocumentBuilder

  const document = SwaggerModule.createDocument(app, config); // Cria o documento de especificação OpenAPI (Swagger)
  SwaggerModule.setup('api', app, document); // Configura o Swagger UI para ser servido na rota /api
  // Agora você pode acessar a documentação em http://localhost:3000/api no seu navegador
}

/**
 * @swagger
 * /:
 *   get:
 *     summary: Retorna a página inicial da API
 *     description: Retorna uma mensagem de boas-vindas para verificar se a API está funcionando.
 *     responses:
 *       200:
 *         description: Página inicial exibida com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Bem-vindo à API do Portfólio do Rainer!"
 */
async function bootstrapServer(): Promise<ReturnType<typeof serverless>> {
  // Verifica se já existe uma instância cached do servidor.
  if (!cachedServer) {
    console.log('⚡ Inicializando o servidor NestJS...'); // Loga o início da inicialização.
    // Cria a aplicação NestJS usando Fastify como adaptador HTTP para alta performance.
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule, // Módulo raiz da aplicação NestJS.
      new FastifyAdapter({ logger: true }), // Usa o adaptador Fastify com logging ativado (útil em desenvolvimento).
    );
    // Habilita CORS para permitir requisições de diferentes origens (configurado para permitir todas as origens neste exemplo - ajuste conforme necessário em produção).
    app.enableCors({
      origin: '*', // Permite requisições de qualquer origem.
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos HTTP permitidos.
    });
    // Inicializa a aplicação NestJS.
    await app.init();

    // Configuração do Swagger UI
    await setupSwagger(app);

    // Cria um servidor "serverless" a partir da instância do Fastify, utilizando a biblioteca 'serverless-http'.
    // Esse servidor serverless é compatível com o formato de eventos do AWS Lambda e API Gateway.
    cachedServer = serverless(app.getHttpAdapter().getInstance());
    console.log('✅ Servidor inicializado e pronto para requisições!'); // Loga o sucesso na inicialização.
  }

  // Retorna a instância cached do servidor (seja a nova ou a existente).
  return cachedServer;
}

/**
 * Handler principal para AWS Lambda. Recebe eventos do Lambda Function URL e contexto de execução do Lambda.
 * É o ponto de entrada da função Lambda na AWS.
 * @param event Objeto de evento do Lambda Function URL, contendo detalhes da requisição HTTP.
 * @param context Objeto de contexto do AWS Lambda, com informações sobre o ambiente de execução.
 * @returns Promise<any> Promise que resolve com a resposta HTTP formatada para o Lambda Function URL.
 */
export const handler = async (event: LambdaEvent, context: LambdaContext) => {
  const server = await bootstrapServer();
  return server(event, context);
};

/**
 * @swagger
 * /local:
 *   get:
 *     summary: Inicializa o servidor local para desenvolvimento
 *     description: Endpoint utilizado para iniciar o servidor localmente, fora do ambiente AWS Lambda.
 *     responses:
 *       200:
 *         description: Servidor local inicializado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Servidor local iniciado em http://localhost:3000"
 */
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  async function bootstrapLocal() {
    console.log('🚀 Iniciando servidor local...'); // Loga o início do servidor local.
    // Cria a aplicação NestJS usando Fastify como adaptador HTTP (sem logging detalhado para ambiente local - pode ser ajustado).
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule, // Módulo raiz da aplicação.
      new FastifyAdapter(), // Usa o adaptador Fastify para servidor local também.
    );

    // Configuração do Swagger UI
    await setupSwagger(app);

    // Inicia o servidor local na porta 3000 e no endereço 0.0.0.0 (acessível externamente).
    await app.listen(3000, '0.0.0.0', () => {
      console.log(`🔌 Servidor ouvindo em http://localhost:3000`); // Loga o endereço do servidor local.
      console.log(`📚 Documentação Swagger em http://localhost:3000/api`); // Loga o endereço da documentação Swagger (se configurada).
    });
  }

  // Inicializa o servidor local e trata possíveis erros durante a inicialização.
  bootstrapLocal().catch(error => {
    console.log('🚀 Erro ao iniciar o servidor local:'); // LOG PASSO ERRO - CATCH
    logError(error); // Loga qualquer erro que ocorra durante a inicialização do servidor local.
    process.exit(1); // Encerra o processo Node.js em caso de falha na inicialização.
  });
}
