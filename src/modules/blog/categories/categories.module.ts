import { Module, forwardRef } from '@nestjs/common';
import { CategoriesController } from '@src/modules/blog/categories/controllers/categories.controller';
import { CategoryService } from '@src/modules/blog/categories/services/categories.service';
import { BlogModule } from '@src/modules/blog.module';

@Module({
  imports: [forwardRef(() => BlogModule)],
  controllers: [CategoriesController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
