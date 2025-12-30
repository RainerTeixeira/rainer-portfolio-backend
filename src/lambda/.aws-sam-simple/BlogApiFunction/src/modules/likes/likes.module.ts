import { Module } from '@nestjs/common';
import { LikesService } from './services/likes.service';
import { LikesController } from './controllers/likes.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [LikesController],
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule {}
