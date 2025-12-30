import { Module } from '@nestjs/common';
import { BookmarksService } from './services/bookmarks.service';
import { BookmarksController } from './controllers/bookmarks.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BookmarksController],
  providers: [BookmarksService],
  exports: [BookmarksService],
})
export class BookmarksModule {}
