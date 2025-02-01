import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('PostsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/posts (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/posts')
      .send({
        postTitle: 'Test Post',
        postContent: 'Test Content',
        postTags: ['test']
      })
      .expect(201);
  });
});