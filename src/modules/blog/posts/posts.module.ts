import { Module, forwardRef } from '@nestjs/common';
import { PostsController } from './controllers/posts.controller';
import { PostsService } from './services/posts.service';
import { BlogModule } from '@src/modules/blog.module';
import { DynamoDbService } from '@src/services/dynamodb.service';

@Module({
  imports: [forwardRef(() => BlogModule)], // Resolve dependências circulares
  controllers: [PostsController],
  providers: [PostsService, DynamoDbService],
  exports: [PostsService],
})
export class PostsModule {}
