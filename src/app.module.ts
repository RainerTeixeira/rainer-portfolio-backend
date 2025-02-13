import { Module } from '@nestjs/common';
import { BlogModule } from './modules/blog/blog.module';

@Module({
  imports: [
    BlogModule, // Importa o módulo Blog
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }