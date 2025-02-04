import { Injectable } from '@nestjs/common'; // Importa o decorador Injectable do NestJS

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
