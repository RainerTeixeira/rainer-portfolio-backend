import { Module } from '@nestjs/common';
import { DynamoDbModule } from '@src/core/database/dynamodb.module';
import { SubcategoriesController } from './subcategory.controller';
import { SubcategoriesService } from './subcategory.service';
import { SubcategoryRepository } from './subcategory.repository';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    DynamoDbModule,
    CacheModule.register()
  ],
  controllers: [SubcategoriesController],
  providers: [
    SubcategoriesService,
    SubcategoryRepository
  ],
  exports: [SubcategoriesService]
})
export class SubcategoryModule { }