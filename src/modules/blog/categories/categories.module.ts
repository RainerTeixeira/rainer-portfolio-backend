import { Module, forwardRef } from '@nestjs/common';
import { CategoriesController } from '@src/modules/blog/categories/controllers/categories.controller';
import { CategoriesService } from '@src/modules/blog/categories/services/categories.service';
import { BlogModule } from '@src/modules/blog.module';

@Module({
    imports: [forwardRef(() => BlogModule)],
    controllers: [CategoriesController],
    providers: [CategoriesService],
    exports: [CategoriesService],
})
export class CategoriesModule { }
