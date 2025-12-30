"use strict";
/**
 * Script para Ler Memórias do Projeto
 *
 * Este script lê e exibe as informações das memórias do projeto.
 * Pode ser usado por ferramentas MCP ou outros sistemas para carregar contexto.
 *
 * Uso:
 *   npm run memory:read
 *   tsx scripts/08-memoria/read-memory.ts [tipo]
 *
 * Tipos disponíveis:
 *   - all (padrão): Todas as memórias
 *   - initial: Apenas initial-memory.json
 *   - technical: Apenas technical-details.json
 *   - code: Apenas code-analysis.json
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMemories = getMemories;
exports.getMemory = getMemory;
exports.readAllMemories = readAllMemories;
exports.readMemory = readMemory;
var fs_1 = require("fs");
var path_1 = require("path");
var PROJECT_ROOT = process.cwd();
var MEMORIES_DIR = (0, path_1.join)(PROJECT_ROOT, 'docs', '.memories');
/**
 * Caminhos dos arquivos de memória
 */
var MEMORY_PATHS = {
    initial: (0, path_1.join)(MEMORIES_DIR, 'initial-memory.json'),
    technical: (0, path_1.join)(MEMORIES_DIR, 'technical-details.json'),
    code: (0, path_1.join)(MEMORIES_DIR, 'code-analysis.json'),
};
/**
 * Lê um arquivo de memória
 */
function readMemory(path) {
    if (!(0, fs_1.existsSync)(path)) {
        console.error("\u274C Arquivo n\u00E3o encontrado: ".concat(path));
        return null;
    }
    try {
        return JSON.parse((0, fs_1.readFileSync)(path, 'utf-8'));
    }
    catch (error) {
        console.error("\u274C Erro ao ler arquivo ".concat(path, ":"), error);
        return null;
    }
}
/**
 * Lê todas as memórias
 */
function readAllMemories() {
    return {
        initial: readMemory(MEMORY_PATHS.initial),
        technical: readMemory(MEMORY_PATHS.technical),
        code: readMemory(MEMORY_PATHS.code),
    };
}
/**
 * Formata memória para exibição
 */
function formatMemory(memory, type) {
    var _a, _b, _c;
    if (!memory) {
        return "\u274C Mem\u00F3ria ".concat(type, " n\u00E3o encontrada");
    }
    var output = "\n\uD83D\uDCCB ".concat(type.toUpperCase(), "\n");
    output += '═'.repeat(60) + '\n';
    if (type === 'initial' && memory.entities) {
        var project = memory.entities.find(function (e) { return e.fullName === 'rainer-portfolio-backend'; });
        if (project) {
            output += "Projeto: ".concat(project.fullName, "\n");
            output += "\u00DAltima atualiza\u00E7\u00E3o: ".concat(memory.lastModified || 'N/A', "\n\n");
            output += 'Observações:\n';
            (_a = project.observations) === null || _a === void 0 ? void 0 : _a.slice(0, 5).forEach(function (obs) {
                output += "  \u2022 ".concat(obs, "\n");
            });
        }
    }
    else if (type === 'technical' && memory.technicalDetails) {
        output += "Endpoints: ".concat(((_b = memory.technicalDetails.endpoints) === null || _b === void 0 ? void 0 : _b.total) || 'N/A', "\n");
        output += "\u00DAltima atualiza\u00E7\u00E3o: ".concat(memory.lastModified || 'N/A', "\n\n");
        if (memory.technicalDetails.organization) {
            output += 'Estrutura:\n';
            Object.entries(memory.technicalDetails.organization.structure || {}).forEach(function (_a) {
                var key = _a[0], value = _a[1];
                output += "  \u2022 ".concat(key, ": ").concat(value, "\n");
            });
        }
    }
    else if (type === 'code' && memory.entities) {
        var project = memory.entities.find(function (e) { return e.fullName === 'Blog Backend Serverless'; });
        if (project) {
            output += "Projeto: ".concat(project.fullName, "\n");
            output += "Tipo: ".concat(project.entityType, "\n\n");
            output += 'Observações:\n';
            (_c = project.observations) === null || _c === void 0 ? void 0 : _c.slice(0, 5).forEach(function (obs) {
                output += "  \u2022 ".concat(obs, "\n");
            });
        }
    }
    return output;
}
/**
 * Função principal
 */
function main() {
    var type = process.argv[2] || 'all';
    console.log('📖 Lendo memórias do projeto...\n');
    switch (type) {
        case 'initial':
            {
                var memory = readMemory(MEMORY_PATHS.initial);
                console.log(formatMemory(memory, 'initial'));
            }
            break;
        case 'technical':
            {
                var memory = readMemory(MEMORY_PATHS.technical);
                console.log(formatMemory(memory, 'technical'));
            }
            break;
        case 'code':
            {
                var memory = readMemory(MEMORY_PATHS.code);
                console.log(formatMemory(memory, 'code'));
            }
            break;
        case 'all':
        default:
            {
                var memories = readAllMemories();
                console.log(formatMemory(memories.initial, 'initial'));
                console.log(formatMemory(memories.technical, 'technical'));
                console.log(formatMemory(memories.code, 'code'));
            }
            break;
    }
    console.log("\n\uD83D\uDCC1 Localiza\u00E7\u00E3o: ".concat(MEMORIES_DIR));
}
/**
 * Exporta memórias como objeto (para uso em outros scripts)
 */
function getMemories() {
    return readAllMemories();
}
/**
 * Exporta memória específica
 */
function getMemory(type) {
    var path = MEMORY_PATHS[type];
    return readMemory(path);
}
// Executar se chamado diretamente
if (require.main === module) {
    main();
}
