"use strict";
/**
 * Script Automático de Atualização de Versão e Memórias
 *
 * Este script:
 * 1. Detecta mudanças de versão no package.json
 * 2. Atualiza automaticamente todas as referências de versão nas memórias
 * 3. Atualiza lastModified em todos os arquivos de memória
 * 4. Gera log de mudanças
 *
 * Uso:
 *   pnpm run version:update
 *   tsx scripts/08-memoria/update-version.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
exports.updateVersionInAllMemories = updateVersionInAllMemories;
exports.getCurrentVersion = getCurrentVersion;
var fs_1 = require("fs");
var path_1 = require("path");
var update_memory_1 = require("./update-memory");
var PROJECT_ROOT = process.cwd();
var MEMORIES_DIR = (0, path_1.join)(PROJECT_ROOT, 'docs', '.memories');
var PACKAGE_JSON_PATH = (0, path_1.join)(PROJECT_ROOT, 'package.json');
var VERSION_CACHE_PATH = (0, path_1.join)(MEMORIES_DIR, '.version-cache.json');
/**
 * Lê a versão atual do package.json
 */
function getCurrentVersion() {
    var pkg = JSON.parse((0, fs_1.readFileSync)(PACKAGE_JSON_PATH, 'utf-8'));
    return pkg.version;
}
/**
 * Lê a versão cacheada (última versão processada)
 */
function getCachedVersion() {
    if (!(0, fs_1.existsSync)(VERSION_CACHE_PATH)) {
        return null;
    }
    try {
        return JSON.parse((0, fs_1.readFileSync)(VERSION_CACHE_PATH, 'utf-8'));
    }
    catch (_a) {
        return null;
    }
}
/**
 * Salva a versão atual no cache
 */
function saveVersionCache(version) {
    var cache = {
        lastVersion: version,
        lastUpdated: new Date().toISOString(),
    };
    (0, fs_1.writeFileSync)(VERSION_CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
}
/**
 * Atualiza versão em initial-memory.json
 */
function updateVersionInInitialMemory(version) {
    var _a;
    var memoryPath = (0, path_1.join)(MEMORIES_DIR, 'initial-memory.json');
    if (!(0, fs_1.existsSync)(memoryPath)) {
        console.warn("\u26A0\uFE0F Arquivo n\u00E3o encontrado: ".concat(memoryPath));
        return;
    }
    var memory = JSON.parse((0, fs_1.readFileSync)(memoryPath, 'utf-8'));
    var now = new Date().toISOString();
    // Atualizar lastModified
    memory.lastModified = now;
    // Atualizar content com nova versão
    memory.content = memory.content.replace(/v\d+\.\d+\.\d+/, "v".concat(version));
    // Atualizar entidade do projeto
    var projectEntity = (_a = memory.entities) === null || _a === void 0 ? void 0 : _a.find(function (e) { return e.fullName === 'rainer-portfolio-backend'; });
    if (projectEntity) {
        // Atualizar observações que mencionam versão
        projectEntity.observations = projectEntity.observations.map(function (obs) {
            if (obs.includes('Versão:') || obs.includes('v4.1.0') || obs.includes('v4.0.0')) {
                return obs.replace(/v?\d+\.\d+\.\d+.*?Enterprise Edition/, "v".concat(version, " Enterprise Edition"));
            }
            if (obs.includes('4.1.0') || obs.includes('4.0.0')) {
                return obs.replace(/4\.\d+\.\d+/g, version);
            }
            return obs;
        });
        // Atualizar context
        if (memory.context) {
            memory.context.projectVersion = "".concat(version, " Enterprise Edition");
        }
    }
    (0, fs_1.writeFileSync)(memoryPath, JSON.stringify(memory, null, 2), 'utf-8');
    console.log("\u2705 ".concat(memoryPath, " - Vers\u00E3o atualizada para ").concat(version));
}
/**
 * Atualiza versão em technical-details.json
 */
function updateVersionInTechnicalDetails(version) {
    var _a, _b;
    var detailsPath = (0, path_1.join)(MEMORIES_DIR, 'technical-details.json');
    if (!(0, fs_1.existsSync)(detailsPath)) {
        console.warn("\u26A0\uFE0F Arquivo n\u00E3o encontrado: ".concat(detailsPath));
        return;
    }
    var details = JSON.parse((0, fs_1.readFileSync)(detailsPath, 'utf-8'));
    var now = new Date().toISOString();
    // Atualizar lastModified
    details.lastModified = now;
    // Atualizar content com nova versão
    details.content = details.content.replace(/v\d+\.\d+\.\d+/, "v".concat(version));
    // Atualizar versionSync se existir
    if ((_b = (_a = details.technicalDetails) === null || _a === void 0 ? void 0 : _a.documentation) === null || _b === void 0 ? void 0 : _b.versionSync) {
        details.technicalDetails.documentation.versionSync.packageJson = version;
        details.technicalDetails.documentation.versionSync.projectOverview = "".concat(version, " Enterprise Edition");
    }
    (0, fs_1.writeFileSync)(detailsPath, JSON.stringify(details, null, 2), 'utf-8');
    console.log("\u2705 ".concat(detailsPath, " - Vers\u00E3o atualizada para ").concat(version));
}
/**
 * Atualiza versão em code-analysis.json
 */
function updateVersionInCodeAnalysis(version) {
    var _a;
    var analysisPath = (0, path_1.join)(MEMORIES_DIR, 'code-analysis.json');
    if (!(0, fs_1.existsSync)(analysisPath)) {
        console.warn("\u26A0\uFE0F Arquivo n\u00E3o encontrado: ".concat(analysisPath));
        return;
    }
    var analysis = JSON.parse((0, fs_1.readFileSync)(analysisPath, 'utf-8'));
    // Atualizar entidade do projeto
    var projectEntity = (_a = analysis.entities) === null || _a === void 0 ? void 0 : _a.find(function (e) { return e.fullName === 'Blog Backend Serverless'; });
    if (projectEntity) {
        // Atualizar observações que mencionam versão
        projectEntity.observations = projectEntity.observations.map(function (obs) {
            if (obs.includes('Versão:')) {
                return "Vers\u00E3o: ".concat(version, " (package.json)");
            }
            if (obs.includes('v4.1.0') || obs.includes('v4.0.0')) {
                return obs.replace(/v\d+\.\d+\.\d+/, "v".concat(version));
            }
            return obs;
        });
    }
    (0, fs_1.writeFileSync)(analysisPath, JSON.stringify(analysis, null, 2), 'utf-8');
    console.log("\u2705 ".concat(analysisPath, " - Vers\u00E3o atualizada para ").concat(version));
}
/**
 * Atualiza versão em consolidated-memory.json
 */
function updateVersionInConsolidatedMemory(version) {
    var _a;
    var consolidatedPath = (0, path_1.join)(MEMORIES_DIR, 'consolidated-memory.json');
    if (!(0, fs_1.existsSync)(consolidatedPath)) {
        console.warn("\u26A0\uFE0F Arquivo n\u00E3o encontrado: ".concat(consolidatedPath));
        return;
    }
    var consolidated = JSON.parse((0, fs_1.readFileSync)(consolidatedPath, 'utf-8'));
    var now = new Date().toISOString();
    // Atualizar lastModified
    consolidated.lastModified = now;
    // Atualizar project.version
    if (consolidated.project) {
        consolidated.project.version = version;
    }
    // Atualizar entidades
    (_a = consolidated.entities) === null || _a === void 0 ? void 0 : _a.forEach(function (entity) {
        if (entity.fullName === 'rainer-portfolio-backend' || entity.fullName === 'Blog Backend Serverless') {
            entity.observations = entity.observations.map(function (obs) {
                if (obs.includes('Versão:') || obs.includes('v4.1.0') || obs.includes('v4.0.0')) {
                    return obs.replace(/v?\d+\.\d+\.\d+.*?Enterprise Edition/, "v".concat(version, " Enterprise Edition"));
                }
                if (obs.includes('4.1.0') || obs.includes('4.0.0')) {
                    return obs.replace(/4\.\d+\.\d+/g, version);
                }
                return obs;
            });
        }
    });
    // Atualizar summary
    if (consolidated.summary) {
        consolidated.summary = consolidated.summary.replace(/v\d+\.\d+\.\d+/, "v".concat(version));
    }
    (0, fs_1.writeFileSync)(consolidatedPath, JSON.stringify(consolidated, null, 2), 'utf-8');
    console.log("\u2705 ".concat(consolidatedPath, " - Vers\u00E3o atualizada para ").concat(version));
}
/**
 * Função principal - Atualiza versão em todas as memórias
 */
function updateVersionInAllMemories(version) {
    console.log("\n\uD83D\uDD04 Atualizando vers\u00E3o para ".concat(version, " em todas as mem\u00F3rias...\n"));
    updateVersionInInitialMemory(version);
    updateVersionInTechnicalDetails(version);
    updateVersionInCodeAnalysis(version);
    updateVersionInConsolidatedMemory(version);
    console.log("\n\u2705 Todas as mem\u00F3rias foram atualizadas para vers\u00E3o ".concat(version, "!"));
}
/**
 * Função principal - Detecta mudança de versão e atualiza automaticamente
 */
function main() {
    console.log('🔍 Verificando versão do projeto...\n');
    var currentVersion = getCurrentVersion();
    var cached = getCachedVersion();
    console.log("\uD83D\uDCE6 Vers\u00E3o atual no package.json: ".concat(currentVersion));
    if (cached) {
        console.log("\uD83D\uDCCB Vers\u00E3o cacheada: ".concat(cached.lastVersion));
        console.log("\uD83D\uDCC5 \u00DAltima atualiza\u00E7\u00E3o: ".concat(cached.lastUpdated));
        if (cached.lastVersion === currentVersion) {
            console.log('\n✅ Versão não mudou. Nada a fazer.');
            return;
        }
        console.log("\n\uD83D\uDD04 Vers\u00E3o mudou de ".concat(cached.lastVersion, " para ").concat(currentVersion));
    }
    else {
        console.log('\n🆕 Primeira execução. Atualizando memórias...');
    }
    // Atualizar versão em todas as memórias
    updateVersionInAllMemories(currentVersion);
    // Executar atualização completa de memórias
    console.log('\n🔄 Executando atualização completa de memórias...\n');
    try {
        (0, update_memory_1.main)();
    }
    catch (error) {
        console.warn('⚠️ Erro ao executar atualização completa de memórias:', error);
        console.log('✅ Versão atualizada, mas atualização completa falhou. Execute manualmente: npm run memory:update');
    }
    // Salvar versão no cache
    saveVersionCache(currentVersion);
    console.log("\n\u2705 Processo conclu\u00EDdo! Vers\u00E3o ".concat(currentVersion, " sincronizada em todas as mem\u00F3rias."));
}
// Executar se chamado diretamente
if (require.main === module) {
    main();
}
