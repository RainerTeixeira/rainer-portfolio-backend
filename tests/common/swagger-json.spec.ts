import request from 'supertest';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../../src/app.module';
import { applyGlobalAppConfig } from '../../src/common/bootstrap/app.bootstrap';

describe('Swagger JSON (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    // Cria o módulo de teste com o AppModule completo
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Inicializa a aplicação NestJS com adaptador Fastify
    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await applyGlobalAppConfig(app);
    await app.init();

    // Configurar Swagger rapidamente para expor /api-json no ambiente de teste
    const swaggerConfig = new DocumentBuilder().setTitle('Test API').setVersion('1.0.0').build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    const fastifyInstance = app.getHttpAdapter().getInstance();
    fastifyInstance.get('/api-json', async (_request: any, reply: any) => {
      reply.status(200).header('Content-Type', 'application/json; charset=utf-8').send(document);
    });

    await fastifyInstance.ready();
    await app.listen(0);
  });

  afterAll(async () => {
    // Encerra a aplicação após os testes
    await app.close();
  });

  it('deve expor o documento swagger como JSON com content-type correto', async () => {
    // Faz requisição GET para o endpoint do swagger JSON
    const response = await request(app.getHttpServer()).get('/api-json').expect(200);

    // Verifica se o content-type é application/json
    expect(response.headers['content-type']).toMatch(/application\/json/);
    
    // Verifica se o documento possui as propriedades obrigatórias do OpenAPI
    expect(response.body).toHaveProperty('openapi');
    expect(response.body).toHaveProperty('paths');
  });
});
