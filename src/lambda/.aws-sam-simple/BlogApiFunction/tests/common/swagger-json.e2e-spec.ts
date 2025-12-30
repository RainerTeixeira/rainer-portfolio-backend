import request from 'supertest';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../../src/app.module';
import { applyGlobalAppConfig } from '../../src/common/bootstrap/app.bootstrap';

describe('Swagger JSON (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await applyGlobalAppConfig(app);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should expose swagger document as JSON with correct content type', async () => {
    const response = await request(app.getHttpServer()).get('/api-json').expect(200);

    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toHaveProperty('openapi');
    expect(response.body).toHaveProperty('paths');
  });
});
