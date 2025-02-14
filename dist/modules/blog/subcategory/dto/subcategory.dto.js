"use strict";
// src/modules/blog/Subcategory/dto/Subcategory.dto.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubcategoryDto = void 0;
class SubcategoryDto {
    constructor(categoryIdSubcategoryId, subcategoryId, name, slug, description, keywords, title) {
        this.categoryIdSubcategoryId = categoryIdSubcategoryId;
        this.subcategoryId = subcategoryId;
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.keywords = keywords;
        this.title = title;
    }
}
exports.SubcategoryDto = SubcategoryDto;
