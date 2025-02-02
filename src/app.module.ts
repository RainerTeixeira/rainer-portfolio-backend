import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsController } from './controller/posts/posts.controller';
import { PostsService } from './controller/posts/posts.service';

@Module({
  imports: [],
  controllers: [AppController, PostsController],
  providers: [AppService],
})
export class AppModule { }