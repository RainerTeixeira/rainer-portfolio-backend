import { Module } from '@nestjs/common';
import { BookmarksController } from './bookmarks.controller.js';
import { BookmarksService } from './bookmarks.service.js';
import { BookmarksRepository } from './bookmarks.repository.js';

@Module({
  controllers: [BookmarksController],
  providers: [BookmarksService, BookmarksRepository],
  exports: [BookmarksService, BookmarksRepository],
})
export class BookmarksModule {}

