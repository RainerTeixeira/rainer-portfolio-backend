/**
 * Ponto de Entrada da Aplicação - NestJS
 * 
 * Ponto de entrada da aplicação NestJS com Fastify adapter.
 * 
 * @module main
 */

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { applyGlobalAppConfig } from './common/bootstrap/app.bootstrap';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import { AppModule } from './app.module';
import { NODE_ENV, PORT, HOST, BASE_URL } from './common/config';

/**
 * Inicializa a aplicação NestJS com Fastify e configura middlewares, CORS, validação, interceptores e Swagger.
 *
 * Passos principais:
 * - Cria `NestFastifyApplication` com `FastifyAdapter` e logger condicional por ambiente.
 * - Registra `helmet` com ajustes para compatibilidade de APIs e Swagger.
 * - Registra `@fastify/multipart` com limites adequados para upload.
 * - Habilita CORS com origem, métodos e headers permitidos.
 * '- Aplica `ValidationPipe` global para transformação e whitelisting.
 * - Instala `DatabaseProviderInterceptor` para seleção dinâmica de banco por header.
 * - Define rota raiz (`/`) com metadados da API.'
 * - Configura documentação `Swagger` e UI com CSS customizado.
 * - Inicia o servidor em `env.PORT` e `env.HOST` com logs de status.
 *
 * @returns Promise que resolve quando o servidor está escutando.
 *
 * @example
 * // Entry point padrão
 * bootstrap().catch((error) => { console.error(error); process.exit(1); });
 *
 * @remarks
 * - `operationIdFactory` define IDs de operação usando o nome do método, útil para clientes gerados.
 * - O CSS customizado da UI do Swagger melhora legibilidade e organização das tags.
 */
async function bootstrap() {
  // Criar aplicação NestJS com Fastify
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: NODE_ENV === 'development' }),
  );

  // Helmet - Security Headers
  // Configurado para permitir Swagger UI funcionar corretamente
  // CSP e XSS Protection desabilitados por questões de performance e compatibilidade
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await app.register(helmet as any, {
    contentSecurityPolicy: false, // Desabilitado - não necessário para APIs REST
    xssFilter: false, // Desabilitado - header descontinuado pelos navegadores
    crossOriginEmbedderPolicy: false, // Desabilitar para APIs
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Permitir CORS
  });

  // Habilitar multipart para upload de arquivos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await app.register(multipart as any, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB para imagens do blog (aumentado de 2MB)
    },
  });

  // Configurações globais unificadas (ValidationPipe + CORS)
  await applyGlobalAppConfig(app);

  // Rota raiz (/) - Página inicial da API
  const fastifyInstance = app.getHttpAdapter().getInstance();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fastifyInstance.get('/', async (_request: any, reply: any) => {
    reply.status(200).send({
      success: true,
      message: '🚀 Bem-vindo à Blog API!',
      version: '5.0.0',
      description: 'API RESTful moderna para blog com NestJS + Fastify',
      documentation: {
        swagger: `${BASE_URL}/docs`,
        openapi: `${BASE_URL}/api-json`,
      },
      endpoints: {
        health: `${BASE_URL}/health`,
        healthDetailed: `${BASE_URL}/health/detailed`,
      },
      features: [
        '✅ CRUD completo para 7 recursos',
        '✅ MongoDB com Prisma ORM',
        '✅ Autenticação AWS Cognito',
        '✅ Validação robusta com Zod',
        '✅ Type-safe end-to-end',
        '✅ Swagger/OpenAPI 3.0',
      ],
      resources: {
        users: `${BASE_URL}/users`,
        posts: `${BASE_URL}/posts`,
        categories: `${BASE_URL}/categories`,
        comments: `${BASE_URL}/comments`,
        likes: `${BASE_URL}/likes`,
        bookmarks: `${BASE_URL}/bookmarks`,
        notifications: `${BASE_URL}/notifications`,
      },
      database: {
        provider: 'MongoDB',
        description: 'MongoDB + Prisma ORM',
      },
      stack: {
        framework: 'NestJS + Fastify',
        language: 'TypeScript',
        validation: 'Zod + class-validator',
        orm: 'Prisma (MongoDB)',
      },
    });
  });

  // Configuração Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Blog API v5.0.0')
    .setDescription(`
    ## 📝 Visão Geral
    
    API RESTful completa para gerenciamento de blog, construída com **NestJS + Fastify + MongoDB**.
    
    ### 🚀 Características Principais
    - **CRUD completo** para 7 recursos principais
    - **Autenticação** via AWS Cognito
    - **Upload de imagens** via Cloudinary
    - **Sistema de notificações** em tempo real
    - **Dashboard analítico** com estatísticas
    
    ### 📚 Como Usar
    
    1. **Autenticação**: Use os endpoints da tag **auth** para obter tokens JWT
    2. **Recursos**: Cada tag representa um recurso principal (posts, usuários, etc.)
    3. **Filtros**: Use a caixa "Filter by tag" para navegar rapidamente
    4. **Testes**: Clique em qualquer endpoint → "Try it out" → Execute
    
    ### 📊 Status da API
    - **Versão**: 5.0.0
    - **Base URL**: http://localhost:4000
    - **Database**: MongoDB + Prisma ORM
    - **Validação**: class-validator + Zod
    `)
    .setVersion('5.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Token JWT obtido no endpoint /auth/login',
    })
    .addTag('health', '🔍 Verificação de saúde da API')
    .addTag('auth', '🔐 Autenticação e gerenciamento de sessão')
    .addTag('users', '👥 Gestão de usuários e perfis')
    .addTag('posts', '📝 Gerenciamento de posts do blog')
    .addTag('categories', '📂 Organização de categorias')
    .addTag('comments', '💬 Sistema de comentários')
    .addTag('likes', '❤️ Sistema de curtidas')
    .addTag('bookmarks', '🔖 Gerenciamento de favoritos')
    .addTag('notifications', '🔔 Centro de notificações')
    .addTag('dashboard', '📈 Analytics e estatísticas')
    .addTag('cloudinary', '📸 Upload de imagens')
    .setExternalDoc('Documentação Completa', 'https://github.com/rainersoft/blog-api')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customCss: `
      /* Limpeza geral - remover poluição visual */
      .swagger-ui .topbar { 
        display: none; 
      }
      
      /* Header principal mais limpo */
      .swagger-ui .info {
        margin: 30px 0;
        padding: 20px;
        background: #f8fafc;
        border-radius: 8px;
        border-left: 4px solid #4299e1;
      }
      
      .swagger-ui .info .title {
        color: #1a202c;
        font-size: 32px;
        font-weight: 600;
        margin-bottom: 16px;
      }
      
      .swagger-ui .info .description {
        color: #4a5568;
        font-size: 15px;
        line-height: 1.7;
      }
      
      .swagger-ui .info .description h2 {
        color: #2d3748;
        font-size: 18px;
        margin-top: 24px;
        margin-bottom: 12px;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 8px;
      }
      
      .swagger-ui .info .description h3 {
        color: #2d3748;
        font-size: 16px;
        margin-top: 20px;
        margin-bottom: 8px;
      }
      
      .swagger-ui .info .description ul {
        margin-left: 20px;
        color: #4a5568;
      }
      
      .swagger-ui .info .description li {
        margin: 4px 0;
      }
      
      /* Seletor de esquema mais discreto */
      .swagger-ui .scheme-container {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 16px;
        margin: 20px 0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      /* Cores sutis para métodos HTTP */
      .swagger-ui .opblock.opblock-post {
        border-color: #48bb78;
        background: rgba(72, 187, 120, 0.05);
      }
      
      .swagger-ui .opblock.opblock-post .opblock-summary {
        border-color: #48bb78;
        color: #22543d;
      }
      
      .swagger-ui .opblock.opblock-get {
        border-color: #4299e1;
        background: rgba(66, 153, 225, 0.05);
      }
      
      .swagger-ui .opblock.opblock-get .opblock-summary {
        border-color: #4299e1;
        color: #2c5282;
      }
      
      .swagger-ui .opblock.opblock-put {
        border-color: #ed8936;
        background: rgba(237, 137, 54, 0.05);
      }
      
      .swagger-ui .opblock.opblock-put .opblock-summary {
        border-color: #ed8936;
        color: #7c2d12;
      }
      
      .swagger-ui .opblock.opblock-delete {
        border-color: #f56565;
        background: rgba(245, 101, 101, 0.05);
      }
      
      .swagger-ui .opblock.opblock-delete .opblock-summary {
        border-color: #f56565;
        color: #742a2a;
      }
      
      .swagger-ui .opblock.opblock-patch {
        border-color: #9f7aea;
        background: rgba(159, 122, 234, 0.05);
      }
      
      .swagger-ui .opblock.opblock-patch .opblock-summary {
        border-color: #9f7aea;
        color: #44337a;
      }
      
      /* Botão de authorize mais limpo */
      .swagger-ui .btn.authorize {
        background: #4299e1;
        border: none;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: 500;
      }
      
      .swagger-ui .btn.authorize:hover {
        background: #3182ce;
      }
      
      /* Tags mais organizadas */
      .swagger-ui .opblock-tag-section .opblock-tag {
        background: #f7fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 12px 16px;
        margin-bottom: 16px;
        font-size: 16px;
        font-weight: 600;
        color: #2d3748;
      }
      
      /* Modelos mais compactos */
      .swagger-ui .model-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
      }
      
      .swagger-ui .model .property {
        color: #4a5568;
      }
      
      /* Parâmetros mais claros */
      .swagger-ui .parameter__name {
        color: #2d3748;
        font-weight: 600;
      }
      
      .swagger-ui .parameter__type {
        color: #718096;
        font-family: monospace;
      }
      
      /* Respostas mais legíveis */
      .swagger-ui .highlight-code {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        padding: 16px;
        overflow-x: auto;
      }
      
      /* Remove sombras excessivas */
      .swagger-ui .opblock {
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        border-radius: 6px;
        margin-bottom: 16px;
      }
      
      /* Melhorar contraste */
      .swagger-ui .opblock .opblock-summary-description {
        color: #4a5568;
        font-size: 14px;
      }
      
      /* Filtros mais visíveis */
      .swagger-ui .filter-container {
        margin: 20px 0;
        padding: 16px;
        background: #f8fafc;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
      }
      
      .swagger-ui .filter-container .filter {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #cbd5e0;
        border-radius: 4px;
        font-size: 14px;
      }
    `,
    customSiteTitle: 'Blog API v5.0.0 - Documentação',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      tryItOutEnabled: true,
    },
  });

  // Iniciar servidor
  console.log(`🔄 Iniciando servidor na porta ${PORT} (host: ${HOST})...`);
  
  try {
    // Fastify/NestJS: sintaxe correta - usar parâmetros separados ou objeto
    // Segundo a documentação NestJS: app.listen(port, host)
    const port = Number(PORT);
    const host = HOST;
    
    console.log(`📡 Tentando escutar em ${host}:${port}...`);
    await app.listen(port, host);
    
    console.log(`
  ═══════════════════════════════════════════════════════════
    🚀 NestJS + Fastify + MongoDB + Prisma + Zod
  ═══════════════════════════════════════════════════════════
    Ambiente:       ${NODE_ENV}
    Porta:          ${PORT}
    URL:            ${BASE_URL}
    Docs:           ${BASE_URL}/docs
    Database:       MongoDB + Prisma
    Segurança:      Helmet ✅ | CORS ✅ | Zod ✅
  ═══════════════════════════════════════════════════════════
    `);
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    throw error;
  }
}

bootstrap().catch((error) => {
  console.error('❌ Erro ao iniciar aplicação:', error);
  process.exit(1);
});

