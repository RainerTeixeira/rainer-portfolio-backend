"use strict";
// src/modules/blog/blog.module.ts
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogModule = void 0;
const common_1 = require("@nestjs/common");
const authors_module_1 = require("./blog/authors/authors.module"); // import com @src  
const categories_module_1 = require("./blog/categories/categories.module"); // Import com @src
const comments_module_1 = require("./blog/comments/comments.module"); // Import com @src
const posts_module_1 = require("./blog/posts/posts.module"); // Import com @src
const subcategory_module_1 = require("./blog/Subcategory/subcategory.module"); // Import com @src
let BlogModule = class BlogModule {
};
exports.BlogModule = BlogModule;
exports.BlogModule = BlogModule = __decorate([
    (0, common_1.Module)({
        imports: [
            authors_module_1.AuthorsModule,
            categories_module_1.CategoriesModule,
            comments_module_1.CommentsModule,
            posts_module_1.PostsModule,
            subcategory_module_1.SubcategoryModule,
        ],
        exports: [
            authors_module_1.AuthorsModule,
            categories_module_1.CategoriesModule,
            comments_module_1.CommentsModule,
            posts_module_1.PostsModule,
            subcategory_module_1.SubcategoryModule,
        ],
    })
], BlogModule);
