"use strict";
/**
 * Memory Loader - Carregador Automático de Memórias
 *
 * Este módulo carrega automaticamente as memórias do projeto.
 * Pode ser importado em outros scripts ou ferramentas MCP.
 *
 * Uso:
 *   import { loadProjectMemories } from './scripts/08-memoria/memory-loader';
 *   const memories = loadProjectMemories();
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadProjectMemories = loadProjectMemories;
exports.getProjectSummary = getProjectSummary;
var fs_1 = require("fs");
var path_1 = require("path");
var PROJECT_ROOT = process.cwd();
var MEMORIES_DIR = (0, path_1.join)(PROJECT_ROOT, 'docs', '.memories');
/**
 * Carrega todas as memórias do projeto
 */
function loadProjectMemories() {
    var memories = {
        loadedAt: new Date().toISOString(),
    };
    // Carregar initial-memory.json
    var initialPath = (0, path_1.join)(MEMORIES_DIR, 'initial-memory.json');
    if ((0, fs_1.existsSync)(initialPath)) {
        try {
            memories.initial = JSON.parse((0, fs_1.readFileSync)(initialPath, 'utf-8'));
        }
        catch (error) {
            console.warn('⚠️ Erro ao carregar initial-memory.json:', error);
        }
    }
    // Carregar technical-details.json
    var technicalPath = (0, path_1.join)(MEMORIES_DIR, 'technical-details.json');
    if ((0, fs_1.existsSync)(technicalPath)) {
        try {
            memories.technical = JSON.parse((0, fs_1.readFileSync)(technicalPath, 'utf-8'));
        }
        catch (error) {
            console.warn('⚠️ Erro ao carregar technical-details.json:', error);
        }
    }
    // Carregar code-analysis.json
    var codePath = (0, path_1.join)(MEMORIES_DIR, 'code-analysis.json');
    if ((0, fs_1.existsSync)(codePath)) {
        try {
            memories.code = JSON.parse((0, fs_1.readFileSync)(codePath, 'utf-8'));
        }
        catch (error) {
            console.warn('⚠️ Erro ao carregar code-analysis.json:', error);
        }
    }
    return memories;
}
/**
 * Obtém resumo rápido do projeto
 */
function getProjectSummary() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    var memories = loadProjectMemories();
    // Extrair do initial-memory
    var projectEntity = (_b = (_a = memories.initial) === null || _a === void 0 ? void 0 : _a.entities) === null || _b === void 0 ? void 0 : _b.find(function (e) { return e.fullName === 'rainer-portfolio-backend'; });
    return {
        name: (projectEntity === null || projectEntity === void 0 ? void 0 : projectEntity.fullName) || 'rainer-portfolio-backend',
        version: ((_d = (_c = memories.technical) === null || _c === void 0 ? void 0 : _c.technicalDetails) === null || _d === void 0 ? void 0 : _d.version) || '4.1.0',
        description: ((_e = projectEntity === null || projectEntity === void 0 ? void 0 : projectEntity.observations) === null || _e === void 0 ? void 0 : _e[0]) || 'Blog API Backend',
        framework: 'NestJS 11 + Fastify 4',
        database: ['MongoDB (Prisma)', 'DynamoDB (AWS SDK)'],
        testing: {
            framework: 'Jest',
            coverage: ((_k = (_j = (_h = (_g = (_f = memories.technical) === null || _f === void 0 ? void 0 : _f.technicalDetails) === null || _g === void 0 ? void 0 : _g.quality) === null || _h === void 0 ? void 0 : _h.metrics) === null || _j === void 0 ? void 0 : _j.coverage) === null || _k === void 0 ? void 0 : _k.lines) || '99.57%',
        },
    };
}
/**
 * Auto-carrega memórias no import (para uso em MCP)
 */
if (typeof global !== 'undefined') {
    // @ts-ignore
    global.projectMemories = loadProjectMemories();
}
exports.default = loadProjectMemories;
