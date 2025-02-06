"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogModule = void 0;
// src/modules/blog/blog.module.ts
const common_1 = require("@nestjs/common");
const posts_module_1 = require("./blog/posts/posts.module");
//import { AuthorsModule } from '@src/modules/blog/authors/autor.module';
//import { CategoriesModule } from '@src/modules/blog/authors/categories.module';
//import { CommentsModule } from '@src/modules/blog/authors/comments.module';
//import { ExternalIntegrationsModule } from './external-integrations/external-integrations.module';
let BlogModule = class BlogModule {
};
exports.BlogModule = BlogModule;
exports.BlogModule = BlogModule = __decorate([
    (0, common_1.Module)({
        imports: [
            posts_module_1.PostsModule,
            //AuthorsModule,
            //CategoriesModule,
            //CommentsModule,
            //ExternalIntegrationsModule,
        ],
    })
], BlogModule);
