"use strict";
// src/modules/blog/Subcategory/dto/Subcategory.dto.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subcategory = void 0;
class Subcategory {
}
exports.Subcategory = Subcategory;
Dto;
{
    'categoryId#subcategoryId';
    string; // Chave de Partição composta (categoryId#subcategoryId) - String
    subcategoryId: string; // Chave de Classificação (subcategoryId) - String
    name: string;
    slug: string;
    seo: { // Map aninhado
        description ?  : string;
        keywords ?  : string;
        title ?  : string;
    }
    ;
}
