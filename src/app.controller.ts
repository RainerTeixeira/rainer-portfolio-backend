import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service'; // Importa o serviço AppService do arquivo app.service.ts

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
