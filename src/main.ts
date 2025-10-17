/**
 * Entry Point - NestJS Application
 * 
 * Ponto de entrada da aplicação NestJS com Fastify adapter.
 * 
 * @module main
 */

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from '@fastify/helmet';
import { AppModule } from './app.module.js';
import { env } from './config/env.js';
import { DatabaseProviderInterceptor, DatabaseProviderContextService } from './utils/database-provider/index.js';

/**
 * Bootstrap da aplicação
 */
async function bootstrap() {
  // Criar aplicação NestJS com Fastify
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: env.NODE_ENV === 'development' }),
  );

  // Helmet - Security Headers
  // Configurado para permitir Swagger UI funcionar corretamente
  await app.register(helmet as any, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`], // Swagger precisa de inline styles
        scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`], // Swagger precisa de inline scripts
        imgSrc: [`'self'`, 'data:', 'https:', 'http:'], // Permitir imagens externas
        fontSrc: [`'self'`, 'data:'],
        connectSrc: [`'self'`],
        frameSrc: [`'none'`],
        objectSrc: [`'none'`],
        baseUri: [`'self'`],
        formAction: [`'self'`],
      },
    },
    crossOriginEmbedderPolicy: false, // Desabilitar para APIs
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Permitir CORS
  });

  // Habilitar CORS
  app.enableCors({
    origin: env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Global Validation Pipe (Zod)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global Interceptor para Database Provider
  const databaseContext = app.get(DatabaseProviderContextService);
  app.useGlobalInterceptors(new DatabaseProviderInterceptor(databaseContext));

  // Configuração Swagger
  const config = new DocumentBuilder()
    .setTitle('📝 Blog API - NestJS + Fastify + Prisma/DynamoDB')
    .setDescription(`
## 🚀 API RESTful Moderna para Blog

**Stack:**
- Framework: NestJS + Fastify
- Database: MongoDB (Prisma) / DynamoDB (AWS)
- Validação: Zod + class-validator
- Documentação: Swagger/OpenAPI 3.0

**Features:**
- ✅ CRUD completo para 7 recursos
- ✅ Validação robusta com Zod
- ✅ Type-safe end-to-end
- ✅ Dependency Injection
- ✅ Modular e escalável
- ✅ **Escolha dinâmica entre Prisma e DynamoDB**

## 🗄️ Seleção de Banco de Dados

Use o header **X-Database-Provider** para escolher o banco em cada requisição:
- **PRISMA** - MongoDB + Prisma (local)
- **DYNAMODB** - DynamoDB Local ou AWS (detecta automaticamente)

**Cenários suportados:**
1. **Local com Prisma**: MongoDB + Prisma (desenvolvimento rápido)
2. **Local com DynamoDB**: DynamoDB Local (testes pré-produção)
3. **Nuvem com DynamoDB**: DynamoDB AWS (produção)

💡 **Dica:** O sistema detecta automaticamente se DynamoDB é local ou AWS pela presença do \`DYNAMODB_ENDPOINT\`!
    `)
    .setVersion('4.0.0')
    .addTag('❤️ Health Check', 'Endpoints para verificar a saúde da aplicação e conectividade com banco de dados')
    .addTag('🔐 Autenticação', 'Sistema de autenticação com AWS Cognito - registro, login, recuperação de senha')
    .addTag('👤 Usuários', 'Gerenciamento completo de usuários - criação, autenticação, perfis e permissões')
    .addTag('📄 Posts', 'CRUD de posts com suporte a rascunhos, publicação, subcategorias e sistema de views')
    .addTag('🏷️ Categorias', 'Gestão de categorias hierárquicas com subcategorias e slugs SEO-friendly')
    .addTag('💬 Comentários', 'Sistema de comentários com aprovação, moderação e threads aninhados')
    .addTag('❤️ Likes', 'Sistema de curtidas para posts com contadores e verificação de estado')
    .addTag('🔖 Bookmarks', 'Favoritos organizados em coleções personalizadas por usuário')
    .addTag('🔔 Notificações', 'Sistema de notificações em tempo real com controle de leitura')
    .addBearerAuth()
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-Database-Provider',
        in: 'header',
        description: '🗄️ Escolha o banco: PRISMA (MongoDB) ou DYNAMODB',
      },
      'X-Database-Provider',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
  });

  // CSS customizado para UI bonita
  const customCss = `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 50px 0; }
    .swagger-ui .info .title { font-size: 2.5em; font-weight: bold; }
    .swagger-ui .info .description { font-size: 1.1em; line-height: 1.6; }
    .swagger-ui .opblock-tag { 
      border-bottom: 3px solid #89bf04; 
      font-size: 1.8em; 
      padding: 20px 0;
      margin: 30px 0;
    }
    .swagger-ui .opblock { 
      margin: 10px 0; 
      border-radius: 8px; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .swagger-ui .opblock.opblock-post { border-color: #49cc90; background: rgba(73,204,144,.1); }
    .swagger-ui .opblock.opblock-get { border-color: #61affe; background: rgba(97,175,254,.1); }
    .swagger-ui .opblock.opblock-put { border-color: #fca130; background: rgba(252,161,48,.1); }
    .swagger-ui .opblock.opblock-delete { border-color: #f93e3e; background: rgba(249,62,62,.1); }
    .swagger-ui .opblock.opblock-patch { border-color: #50e3c2; background: rgba(80,227,194,.1); }
    .swagger-ui .opblock-summary { padding: 15px; font-size: 1.1em; }
    .swagger-ui .opblock-summary-path { font-weight: 600; }
    .swagger-ui .scheme-container { 
      background: linear-gradient(to right, #667eea 0%, #764ba2 100%);
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .swagger-ui .btn.authorize { 
      background: #89bf04;
      border-color: #89bf04;
    }
    .swagger-ui .btn.authorize:hover { 
      background: #7aa103;
    }
    .swagger-ui .opblock-tag-section { margin: 40px 0; }
    .swagger-ui .opblock-description-wrapper p { font-size: 1em; line-height: 1.5; }
    .swagger-ui select { font-size: 1em; padding: 8px; }
  `;

  SwaggerModule.setup('docs', app, document, {
    customCss,
    customSiteTitle: '📝 Blog API - Documentação',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
      docExpansion: 'list',
    },
  });

  // Iniciar servidor
  await app.listen(env.PORT, env.HOST);

  console.log(`
  ═══════════════════════════════════════════════════════════
    🚀 NestJS + Fastify + MongoDB(Prisma)/DynamoDB + Zod
  ═══════════════════════════════════════════════════════════
    Ambiente:       ${env.NODE_ENV}
    Porta:          ${env.PORT}
    URL:            http://localhost:${env.PORT}
    Docs:           http://localhost:${env.PORT}/docs
    Database:       ${process.env.DATABASE_PROVIDER || 'PRISMA'}
    Segurança:      Helmet ✅ | CORS ✅ | Zod ✅
  ═══════════════════════════════════════════════════════════
  `);
}

bootstrap().catch((error) => {
  console.error('❌ Erro ao iniciar aplicação:', error);
  process.exit(1);
});

