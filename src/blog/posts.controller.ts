import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('blog/posts')
export class PostsController {
  // ...existing code...

  @UseGuards(AuthGuard('cognito'))
  @Get()
  findAll() {
    // ...existing code...
  }

  @UseGuards(AuthGuard('cognito'))
  @Post()
  create() {
    // ...existing code...
  }

  // ...existing code...
}
