import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller'; // Importa o AppController
import { AppService } from './app.service'; // Importa o AppService

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should return "Hello World!"', () => {
    expect(appController.getHello()).toBe('Hello World!');
  });
});
