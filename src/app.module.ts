import { Module } from '@nestjs/common';
import { BlogModule } from '@src/modules/blog.module'; // Importando o BlogModule com o alias configurado
import { AuthModule } from '@src/auth/auth.module'; // Importando o auth module...
@Module({
  imports: [
    BlogModule, // Inclui o BlogModule com todas as funcionalidades do blog (posts, autores, etc.)
    AuthModule, // Inclui o AuthModule para autenticação
  ],

})
export class AppModule {}
