import { Module } from '@nestjs/common';
import { DynamoDbModule } from '@src/core/database/dynamodb.module';
import { CategoriesController } from './category.controller';
import { CategoriesService } from './category.service';
import { CategoryRepository } from './category.repository';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    DynamoDbModule,
    CacheModule.register()
  ],
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    CategoryRepository
  ],
  exports: [CategoriesService]
})
export class CategoryModule { }