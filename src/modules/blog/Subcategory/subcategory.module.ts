// src/modules/blog/Subcategory/Subcategory.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { SubcategoryController } from '@src/modules/blog/subcategory/controllers/subcategory.controller';
import { SubcategoryService } from '@src/modules/blog/subcategory/services/subcategory.service';
import { BlogModule } from '@src/modules/blog.module';
import { DynamoDbService } from '@src/services/dynamoDb.service';

@Module({
  imports: [forwardRef(() => BlogModule)],
  controllers: [SubcategoryController],
  providers: [SubcategoryService, DynamoDbService],
  exports: [SubcategoryService],
})
export class SubcategoryModule {}