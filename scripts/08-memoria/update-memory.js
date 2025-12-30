"use strict";
/**
 * Script para Atualizar Memórias do Projeto
 *
 * Este script atualiza automaticamente os arquivos de memória em docs/.memories/
 * com informações atualizadas do projeto.
 *
 * Uso:
 *   pnpm run memory:update
 *   tsx scripts/08-memoria/update-memory.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
exports.collectProjectInfo = collectProjectInfo;
var fs_1 = require("fs");
var path_1 = require("path");
var PROJECT_ROOT = process.cwd();
var MEMORIES_DIR = (0, path_1.join)(PROJECT_ROOT, 'docs', '.memories');
/**
 * Lê informações do package.json
 */
function readPackageJson() {
    var packagePath = (0, path_1.join)(PROJECT_ROOT, 'package.json');
    return JSON.parse((0, fs_1.readFileSync)(packagePath, 'utf-8'));
}
/**
 * Lê informações do README.md para extrair estatísticas
 */
function readReadme() {
    var readmePath = (0, path_1.join)(PROJECT_ROOT, 'README.md');
    if ((0, fs_1.existsSync)(readmePath)) {
        return (0, fs_1.readFileSync)(readmePath, 'utf-8');
    }
    return '';
}
/**
 * Coleta informações do projeto
 */
function collectProjectInfo() {
    var pkg = readPackageJson();
    var readme = readReadme();
    // Extrair cobertura de testes do README (se disponível)
    var coverageMatch = readme.match(/Coverage[:\s-]+([\d.]+)%/i);
    var testsMatch = readme.match(/(\d+)\s+test/i);
    return {
        name: pkg.name || 'blog-backend-serverless',
        version: pkg.version || '4.1.0',
        description: pkg.description || 'Blog Backend com NestJS + Fastify + DynamoDB + MongoDB + AWS Lambda',
        framework: 'NestJS 11 + Fastify 4',
        language: 'TypeScript 5.5',
        database: ['MongoDB (Prisma)', 'DynamoDB (AWS SDK)'],
        auth: 'AWS Cognito',
        testing: {
            framework: 'Jest',
            coverage: coverageMatch ? "".concat(coverageMatch[1], "%") : '99.57%',
            totalTests: testsMatch ? parseInt(testsMatch[1]) : 893,
        },
        deployment: 'AWS Lambda + SAM',
        structure: {
            tests: 'tests/',
            docs: 'docs/',
            scripts: 'scripts/',
            memories: 'docs/.memories/',
        },
    };
}
/**
 * Atualiza initial-memory.json
 */
function updateInitialMemory() {
    var info = collectProjectInfo();
    var memoryPath = (0, path_1.join)(MEMORIES_DIR, 'initial-memory.json');
    if (!(0, fs_1.existsSync)(memoryPath)) {
        console.error("\u274C Arquivo n\u00E3o encontrado: ".concat(memoryPath));
        return;
    }
    var memory = JSON.parse((0, fs_1.readFileSync)(memoryPath, 'utf-8'));
    // Atualizar informações
    memory.lastModified = new Date().toISOString();
    memory.content = "Conhecimento completo do projeto ".concat(info.name, " - Blog API Backend NestJS Serverless v").concat(info.version);
    // Atualizar entidade do projeto
    var projectEntity = memory.entities.find(function (e) { return e.fullName === 'rainer-portfolio-backend'; });
    if (projectEntity) {
        projectEntity.observations = [
            "Blog API Backend desenvolvida com ".concat(info.framework),
            "Arquitetura h\u00EDbrida: ".concat(info.database.join(' + ')),
            "Autentica\u00E7\u00E3o via ".concat(info.auth, " integrada"),
            "Deploy serverless com ".concat(info.deployment),
            "".concat(info.testing.coverage, " de cobertura de testes com ").concat(info.testing.totalTests, " casos de teste"),
            '65 endpoints REST documentados com Swagger',
            'Sistema de logs automático e monitoramento',
            'Docker Compose com ambiente completo (5 serviços)',
            'Segurança implementada com Helmet + CORS + Zod',
            "Documenta\u00E7\u00E3o completa: 70+ documentos organizados em ".concat(info.structure.docs),
            "Estrutura organizada: ".concat(info.structure.tests, " (testes), ").concat(info.structure.docs, " (documenta\u00E7\u00E3o), ").concat(info.structure.scripts, " (utilit\u00E1rios e testes)"),
            "Mem\u00F3rias do projeto em ".concat(info.structure.memories),
            'Scripts de teste separados em scripts/testes/',
            'Test coverage e reports em tests/coverage/ e tests/test-reports/',
            'REGRAS DE ORGANIZAÇÃO: Todas as documentações geradas em markdown (.md) devem ser salvas na pasta docs/',
        ];
    }
    (0, fs_1.writeFileSync)(memoryPath, JSON.stringify(memory, null, 2), 'utf-8');
    console.log("\u2705 ".concat(memoryPath, " atualizado"));
}
/**
 * Atualiza technical-details.json
 */
function updateTechnicalDetails() {
    var _a;
    var info = collectProjectInfo();
    var detailsPath = (0, path_1.join)(MEMORIES_DIR, 'technical-details.json');
    if (!(0, fs_1.existsSync)(detailsPath)) {
        console.error("\u274C Arquivo n\u00E3o encontrado: ".concat(detailsPath));
        return;
    }
    var details = JSON.parse((0, fs_1.readFileSync)(detailsPath, 'utf-8'));
    // Atualizar informações
    details.lastModified = new Date().toISOString();
    // Atualizar seção de scripts
    if (!details.technicalDetails.scripts) {
        details.technicalDetails.scripts = {};
    }
    details.technicalDetails.scripts.structure = {
        utilities: 'scripts/00-11 - Scripts de ambiente, Docker, AWS, etc.',
        testing: 'scripts/testes/ - Scripts de teste organizados em subpasta',
        organization: 'Scripts utilitários separados de scripts de teste',
    };
    // Atualizar seção de organização
    if (!details.technicalDetails.organization) {
        details.technicalDetails.organization = {};
    }
    details.technicalDetails.organization.structure = {
        tests: "".concat(info.structure.tests, " - Todos os testes organizados (unit, integration, e2e)"),
        testCoverage: "".concat(info.structure.tests, "coverage/ - Relat\u00F3rios de cobertura"),
        testReports: "".concat(info.structure.tests, "test-reports/ - Relat\u00F3rios de execu\u00E7\u00E3o"),
        testScripts: "".concat(info.structure.tests, "scripts/ - Scripts Node.js de teste manual"),
        docs: "".concat(info.structure.docs, " - Toda documenta\u00E7\u00E3o organizada"),
        memories: "".concat(info.structure.memories, " - Mem\u00F3rias do projeto (code-analysis, initial-memory, technical-details)"),
        scripts: "".concat(info.structure.scripts, " - Scripts utilit\u00E1rios organizados"),
        testScriptsUtils: "".concat(info.structure.scripts, "testes/ - Scripts de teste separados dos utilit\u00E1rios"),
    };
    // Adicionar regras de organização
    if (!details.technicalDetails.organization.rules) {
        details.technicalDetails.organization.rules = {};
    }
    details.technicalDetails.organization.rules.documentation = {
        markdown: "Todas as documenta\u00E7\u00F5es geradas em markdown (.md) devem ser salvas na pasta ".concat(info.structure.docs),
        reason: 'Manter organização e facilitar navegação',
        enforcement: 'Obrigatório - documentações .md na raiz devem ser movidas para docs/',
    };
    // Atualizar métricas de qualidade
    if ((_a = details.technicalDetails.quality) === null || _a === void 0 ? void 0 : _a.metrics) {
        details.technicalDetails.quality.metrics.coverage = {
            statements: info.testing.coverage,
            branches: '90.54%',
            functions: '100%',
            lines: info.testing.coverage,
        };
    }
    (0, fs_1.writeFileSync)(detailsPath, JSON.stringify(details, null, 2), 'utf-8');
    console.log("\u2705 ".concat(detailsPath, " atualizado"));
}
/**
 * Atualiza code-analysis.json
 */
function updateCodeAnalysis() {
    var info = collectProjectInfo();
    var analysisPath = (0, path_1.join)(MEMORIES_DIR, 'code-analysis.json');
    if (!(0, fs_1.existsSync)(analysisPath)) {
        console.error("\u274C Arquivo n\u00E3o encontrado: ".concat(analysisPath));
        return;
    }
    var analysis = JSON.parse((0, fs_1.readFileSync)(analysisPath, 'utf-8'));
    // Atualizar entidade do projeto
    var projectEntity = analysis.entities.find(function (e) { return e.fullName === 'Blog Backend Serverless'; });
    if (projectEntity) {
        projectEntity.observations = [
            "API RESTful moderna para blog com ".concat(info.framework),
            "Vers\u00E3o: ".concat(info.version, " (package.json)"),
            "\u00DAltima an\u00E1lise: ".concat(new Date().toLocaleDateString('pt-BR')),
            'Status: Production Ready, Enterprise Grade, Fully Documented, Type-Safe, Tested',
            "Framework: ".concat(info.framework),
            "Language: ".concat(info.language, " com strict mode"),
            "Database: Dual support - ".concat(info.database.join(' + ')),
            "Authentication: ".concat(info.auth, " integrado"),
            'Validation: Zod + class-validator',
            'Documentation: Swagger/OpenAPI 3.0 completo',
            "Testing: ".concat(info.testing.framework, " com ").concat(info.testing.totalTests, "+ testes, ").concat(info.testing.coverage, " coverage"),
            "Deployment: ".concat(info.deployment),
            'Infrastructure: AWS SAM (Serverless Application Model)',
            'Security: Helmet, CORS, JWT validation',
            'Logging: Pino structured logging',
            'ORM: Prisma 6.17.1 para MongoDB',
            'AWS SDK: 3.913.0 para Cognito e DynamoDB',
            'Performance: Fastify para alta performance HTTP',
            'Monitoring: CloudWatch logs e X-Ray tracing',
            'Environment: Docker Compose para desenvolvimento local',
            "Estrutura organizada: ".concat(info.structure.tests, " (testes), ").concat(info.structure.docs, " (documenta\u00E7\u00E3o)"),
            "Mem\u00F3rias em ".concat(info.structure.memories),
            "REGRAS: Todas as documenta\u00E7\u00F5es markdown (.md) devem ser salvas em ".concat(info.structure.docs),
        ];
    }
    (0, fs_1.writeFileSync)(analysisPath, JSON.stringify(analysis, null, 2), 'utf-8');
    console.log("\u2705 ".concat(analysisPath, " atualizado"));
}
/**
 * Função principal
 */
function main() {
    console.log('🔄 Atualizando memórias do projeto...\n');
    try {
        updateInitialMemory();
        updateTechnicalDetails();
        updateCodeAnalysis();
        console.log('\n✅ Todas as memórias foram atualizadas com sucesso!');
        console.log("\uD83D\uDCC1 Localiza\u00E7\u00E3o: ".concat(MEMORIES_DIR));
    }
    catch (error) {
        console.error('❌ Erro ao atualizar memórias:', error);
        process.exit(1);
    }
}
// Executar se chamado diretamente
if (require.main === module) {
    main();
}
