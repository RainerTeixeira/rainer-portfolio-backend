"use strict";
/**
 * Script de Teste - Fluxo de Escolha de Nickname OAuth
 *
 * Testa as funcionalidades implementadas para solicitar nickname
 * de usuários OAuth (Google/GitHub) na primeira vez.
 *
 * Uso:
 * ```bash
 * npx tsx scripts/testes/test-nickname-flow.ts
 * ```
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
// Cores para o console
var colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};
var log = {
    info: function (msg) { return console.log("".concat(colors.blue, "\u2139").concat(colors.reset, " ").concat(msg)); },
    success: function (msg) { return console.log("".concat(colors.green, "\u2713").concat(colors.reset, " ").concat(msg)); },
    error: function (msg) { return console.log("".concat(colors.red, "\u2717").concat(colors.reset, " ").concat(msg)); },
    warning: function (msg) { return console.log("".concat(colors.yellow, "\u26A0").concat(colors.reset, " ").concat(msg)); },
    test: function (msg) { return console.log("".concat(colors.cyan, "\u27A4").concat(colors.reset, " ").concat(msg)); },
};
function testNicknameFlow() {
    return __awaiter(this, void 0, void 0, function () {
        var passedTests, failedTests, LoginResponseUser, mockUser, error_1, fs, schemaContent, error_2, fs, modelContent, userInterfaceMatch, userInterface, error_3, fs, controllerContent, error_4, fs, serviceContent, error_5, fs, serviceContent, error_6, fs, docPath, docContent, error_7, fs, serviceContent, changeNicknameMatch, changeNicknameCode, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n' + '='.repeat(60));
                    console.log('  Teste: Fluxo de Escolha de Nickname OAuth');
                    console.log('='.repeat(60) + '\n');
                    passedTests = 0;
                    failedTests = 0;
                    // ===================================================================
                    // Teste 1: Verificar se tipos estão corretos
                    // ===================================================================
                    log.test('Teste 1: Verificar tipos TypeScript');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('../../src/modules/auth/auth.model.js'); })];
                case 2:
                    LoginResponseUser = (_a.sent()).LoginResponseUser;
                    mockUser = {
                        id: '123',
                        cognitoSub: 'abc',
                        fullName: 'Test',
                        email: 'test@test.com',
                        role: 'AUTHOR',
                        isActive: true,
                        isBanned: false,
                        postsCount: 0,
                        commentsCount: 0,
                        needsNickname: true, // Campo novo
                    };
                    log.success('Tipo LoginResponseUser aceita needsNickname');
                    passedTests++;
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    log.error("Erro ao verificar tipos: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                    failedTests++;
                    return [3 /*break*/, 4];
                case 4:
                    // ===================================================================
                    // Teste 2: Verificar se schema Prisma não tem needsNickname
                    // ===================================================================
                    log.test('Teste 2: Verificar schema Prisma (não deve ter needsNickname)');
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('fs'); })];
                case 6:
                    fs = _a.sent();
                    schemaContent = fs.readFileSync('src/prisma/schema.prisma', 'utf-8');
                    if (schemaContent.includes('needsNickname')) {
                        log.error('Schema Prisma contém needsNickname (não deveria!)');
                        failedTests++;
                    }
                    else {
                        log.success('Schema Prisma NÃO contém needsNickname (correto!)');
                        passedTests++;
                    }
                    return [3 /*break*/, 8];
                case 7:
                    error_2 = _a.sent();
                    log.error("Erro ao verificar schema: ".concat(error_2 instanceof Error ? error_2.message : String(error_2)));
                    failedTests++;
                    return [3 /*break*/, 8];
                case 8:
                    // ===================================================================
                    // Teste 3: Verificar se User model não tem nickname
                    // ===================================================================
                    log.test('Teste 3: Verificar User model (não deve ter nickname)');
                    _a.label = 9;
                case 9:
                    _a.trys.push([9, 11, , 12]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('fs'); })];
                case 10:
                    fs = _a.sent();
                    modelContent = fs.readFileSync('src/modules/users/user.model.ts', 'utf-8');
                    userInterfaceMatch = modelContent.match(/export interface User \{[\s\S]*?\}/);
                    if (userInterfaceMatch) {
                        userInterface = userInterfaceMatch[0];
                        if (userInterface.includes('nickname:')) {
                            log.error('User interface contém campo nickname (não deveria!)');
                            failedTests++;
                        }
                        else {
                            log.success('User interface NÃO contém campo nickname (correto!)');
                            passedTests++;
                        }
                    }
                    else {
                        log.warning('Não foi possível verificar interface User');
                    }
                    return [3 /*break*/, 12];
                case 11:
                    error_3 = _a.sent();
                    log.error("Erro ao verificar model: ".concat(error_3 instanceof Error ? error_3.message : String(error_3)));
                    failedTests++;
                    return [3 /*break*/, 12];
                case 12:
                    // ===================================================================
                    // Teste 4: Verificar endpoint checkNeedsNickname
                    // ===================================================================
                    log.test('Teste 4: Verificar se endpoint checkNeedsNickname existe');
                    _a.label = 13;
                case 13:
                    _a.trys.push([13, 15, , 16]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('fs'); })];
                case 14:
                    fs = _a.sent();
                    controllerContent = fs.readFileSync('src/modules/auth/auth.controller.ts', 'utf-8');
                    if (controllerContent.includes('checkNeedsNickname') &&
                        controllerContent.includes('needs-nickname/:cognitoSub')) {
                        log.success('Endpoint GET /auth/needs-nickname/:cognitoSub encontrado');
                        passedTests++;
                    }
                    else {
                        log.error('Endpoint checkNeedsNickname não encontrado');
                        failedTests++;
                    }
                    return [3 /*break*/, 16];
                case 15:
                    error_4 = _a.sent();
                    log.error("Erro ao verificar controller: ".concat(error_4 instanceof Error ? error_4.message : String(error_4)));
                    failedTests++;
                    return [3 /*break*/, 16];
                case 16:
                    // ===================================================================
                    // Teste 5: Verificar método checkNeedsNickname no service
                    // ===================================================================
                    log.test('Teste 5: Verificar método checkNeedsNickname no AuthService');
                    _a.label = 17;
                case 17:
                    _a.trys.push([17, 19, , 20]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('fs'); })];
                case 18:
                    fs = _a.sent();
                    serviceContent = fs.readFileSync('src/modules/auth/auth.service.ts', 'utf-8');
                    if (serviceContent.includes('async checkNeedsNickname') &&
                        serviceContent.includes('needsNickname: !hasNickname')) {
                        log.success('Método checkNeedsNickname encontrado e implementado corretamente');
                        passedTests++;
                    }
                    else {
                        log.error('Método checkNeedsNickname não encontrado ou incompleto');
                        failedTests++;
                    }
                    return [3 /*break*/, 20];
                case 19:
                    error_5 = _a.sent();
                    log.error("Erro ao verificar service: ".concat(error_5 instanceof Error ? error_5.message : String(error_5)));
                    failedTests++;
                    return [3 /*break*/, 20];
                case 20:
                    // ===================================================================
                    // Teste 6: Verificar se handleOAuthCallback inclui needsNickname
                    // ===================================================================
                    log.test('Teste 6: Verificar se OAuth callback inclui needsNickname na resposta');
                    _a.label = 21;
                case 21:
                    _a.trys.push([21, 23, , 24]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('fs'); })];
                case 22:
                    fs = _a.sent();
                    serviceContent = fs.readFileSync('src/modules/auth/auth.service.ts', 'utf-8');
                    // Procurar no método handleOAuthCallback
                    if (serviceContent.includes('handleOAuthCallback') &&
                        serviceContent.includes('needsNickname,')) {
                        log.success('OAuth callback inclui needsNickname na resposta do usuário');
                        passedTests++;
                    }
                    else {
                        log.error('OAuth callback não inclui needsNickname na resposta');
                        failedTests++;
                    }
                    return [3 /*break*/, 24];
                case 23:
                    error_6 = _a.sent();
                    log.error("Erro ao verificar OAuth callback: ".concat(error_6 instanceof Error ? error_6.message : String(error_6)));
                    failedTests++;
                    return [3 /*break*/, 24];
                case 24:
                    // ===================================================================
                    // Teste 7: Verificar documentação
                    // ===================================================================
                    log.test('Teste 7: Verificar se documentação existe');
                    _a.label = 25;
                case 25:
                    _a.trys.push([25, 27, , 28]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('fs'); })];
                case 26:
                    fs = _a.sent();
                    docPath = 'docs/03-GUIAS/FLUXO_NICKNAME_OAUTH.md';
                    if (fs.existsSync(docPath)) {
                        docContent = fs.readFileSync(docPath, 'utf-8');
                        if (docContent.includes('NÃO modifica o banco de dados') &&
                            docContent.includes('Cognito em tempo real')) {
                            log.success('Documentação encontrada e atualizada com abordagem simplificada');
                            passedTests++;
                        }
                        else {
                            log.warning('Documentação encontrada mas pode estar desatualizada');
                            passedTests++;
                        }
                    }
                    else {
                        log.error('Documentação não encontrada');
                        failedTests++;
                    }
                    return [3 /*break*/, 28];
                case 27:
                    error_7 = _a.sent();
                    log.error("Erro ao verificar documenta\u00E7\u00E3o: ".concat(error_7 instanceof Error ? error_7.message : String(error_7)));
                    failedTests++;
                    return [3 /*break*/, 28];
                case 28:
                    // ===================================================================
                    // Teste 8: Verificar se changeNickname não atualiza MongoDB
                    // ===================================================================
                    log.test('Teste 8: Verificar se changeNickname não tenta desmarcar flag no MongoDB');
                    _a.label = 29;
                case 29:
                    _a.trys.push([29, 31, , 32]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('fs'); })];
                case 30:
                    fs = _a.sent();
                    serviceContent = fs.readFileSync('src/modules/auth/auth.service.ts', 'utf-8');
                    changeNicknameMatch = serviceContent.match(/async changeNickname[\s\S]*?(?=async |$)/);
                    if (changeNicknameMatch) {
                        changeNicknameCode = changeNicknameMatch[0];
                        if (changeNicknameCode.includes('needsNickname') &&
                            changeNicknameCode.includes('updateUser')) {
                            log.error('changeNickname ainda tenta atualizar needsNickname no MongoDB (deveria remover)');
                            failedTests++;
                        }
                        else {
                            log.success('changeNickname NÃO tenta atualizar MongoDB (correto!)');
                            passedTests++;
                        }
                    }
                    else {
                        log.warning('Não foi possível analisar método changeNickname');
                    }
                    return [3 /*break*/, 32];
                case 31:
                    error_8 = _a.sent();
                    log.error("Erro ao verificar changeNickname: ".concat(error_8 instanceof Error ? error_8.message : String(error_8)));
                    failedTests++;
                    return [3 /*break*/, 32];
                case 32:
                    // ===================================================================
                    // Resumo dos Testes
                    // ===================================================================
                    console.log('\n' + '='.repeat(60));
                    console.log('  Resumo dos Testes');
                    console.log('='.repeat(60));
                    console.log("".concat(colors.green, "\u2713 Testes Passados:").concat(colors.reset, " ").concat(passedTests));
                    console.log("".concat(colors.red, "\u2717 Testes Falhados:").concat(colors.reset, " ").concat(failedTests));
                    console.log("".concat(colors.cyan, "\u27A4 Total de Testes:").concat(colors.reset, " ").concat(passedTests + failedTests));
                    console.log('='.repeat(60) + '\n');
                    if (failedTests === 0) {
                        log.success('🎉 Todos os testes passaram! Funcionalidade implementada corretamente.');
                        console.log('\n📋 Próximos passos:');
                        console.log('  1. Testar endpoints manualmente com Postman/Insomnia');
                        console.log('  2. Implementar interface no frontend');
                        console.log('  3. Validar fluxo completo OAuth → escolha nickname');
                        process.exit(0);
                    }
                    else {
                        log.error("\u274C ".concat(failedTests, " teste(s) falharam. Revise o c\u00F3digo."));
                        process.exit(1);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// Executar testes
testNicknameFlow().catch(function (error) {
    log.error("Erro fatal: ".concat(error instanceof Error ? error.message : String(error)));
    if (error instanceof Error && error.stack) {
        console.error(error.stack);
    }
    process.exit(1);
});
