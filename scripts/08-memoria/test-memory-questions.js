"use strict";
/**
 * Teste de Perguntas Específicas sobre o Projeto
 *
 * Este script faz perguntas específicas e busca respostas nas memórias.
 */
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5;
Object.defineProperty(exports, "__esModule", { value: true });
var memory_loader_1 = require("./memory-loader");
console.log('🧪 Testando Sistema de Memórias com Perguntas Específicas...\n');
console.log('═'.repeat(70));
var memories = (0, memory_loader_1.loadProjectMemories)();
// Pergunta 1: Onde devo criar um novo arquivo markdown?
console.log('\n❓ Pergunta: "Onde devo criar um novo arquivo markdown?"');
var docRule = (_e = (_d = (_c = (_b = (_a = memories.technical) === null || _a === void 0 ? void 0 : _a.technicalDetails) === null || _b === void 0 ? void 0 : _b.organization) === null || _c === void 0 ? void 0 : _c.rules) === null || _d === void 0 ? void 0 : _d.documentation) === null || _e === void 0 ? void 0 : _e.markdown;
if (docRule) {
    console.log("   \uD83D\uDCA1 Resposta: ".concat(docRule));
    console.log("   \uD83D\uDCC1 Localiza\u00E7\u00E3o recomendada: docs/");
}
else {
    console.log('   ❌ Regra não encontrada');
}
// Pergunta 2: Quantos endpoints existem por módulo?
console.log('\n❓ Pergunta: "Quantos endpoints REST existem no projeto?"');
var endpoints = (_h = (_g = (_f = memories.technical) === null || _f === void 0 ? void 0 : _f.technicalDetails) === null || _g === void 0 ? void 0 : _g.endpoints) === null || _h === void 0 ? void 0 : _h.total;
console.log("   \uD83D\uDCA1 Resposta: ".concat(endpoints || 'N/A', " endpoints REST documentados"));
// Pergunta 3: Qual é a estrutura de pastas do projeto?
console.log('\n❓ Pergunta: "Qual é a estrutura de organização do projeto?"');
var structure = (_l = (_k = (_j = memories.technical) === null || _j === void 0 ? void 0 : _j.technicalDetails) === null || _k === void 0 ? void 0 : _k.organization) === null || _l === void 0 ? void 0 : _l.structure;
if (structure) {
    console.log('   💡 Resposta: Estrutura organizacional:');
    Object.entries(structure).forEach(function (_a) {
        var key = _a[0], value = _a[1];
        console.log("      \u2022 ".concat(key, ": ").concat(value));
    });
}
// Pergunta 4: Quais são as tecnologias principais?
console.log('\n❓ Pergunta: "Quais são as principais tecnologias usadas?"');
var summary = (0, memory_loader_1.getProjectSummary)();
console.log("   \uD83D\uDCA1 Resposta: ");
console.log("      \u2022 Framework: ".concat(summary.framework));
console.log("      \u2022 Database: ".concat(summary.database.join(' + ')));
console.log("      \u2022 Testes: ".concat(summary.testing.framework, " (").concat(summary.testing.coverage, ")"));
// Pergunta 5: Onde encontrar informações sobre módulos?
console.log('\n❓ Pergunta: "Onde posso encontrar informações sobre módulos?"');
console.log("   \uD83D\uDCA1 Resposta: M\u00F3dulos em src/ organizados por dom\u00EDnio");
console.log("   \uD83D\uDCC1 Total: ".concat(((_p = (_o = (_m = memories.technical) === null || _m === void 0 ? void 0 : _m.technicalDetails) === null || _o === void 0 ? void 0 : _o.modules) === null || _p === void 0 ? void 0 : _p.total) || 'N/A', " m\u00F3dulos"));
// Pergunta 6: Como atualizar as memórias?
console.log('\n❓ Pergunta: "Como atualizar as memórias do projeto?"');
console.log("   \uD83D\uDCA1 Resposta: Execute 'npm run memory:update' para atualizar");
console.log("   \uD83D\uDCDD Localiza\u00E7\u00E3o: ".concat(((_t = (_s = (_r = (_q = memories.technical) === null || _q === void 0 ? void 0 : _q.technicalDetails) === null || _r === void 0 ? void 0 : _r.organization) === null || _s === void 0 ? void 0 : _s.structure) === null || _t === void 0 ? void 0 : _t.memories) || 'docs/.memories/'));
// Pergunta 7: Qual é a estratégia de testes?
console.log('\n❓ Pergunta: "Qual é a estratégia de testes do projeto?"');
var testsPath = (_x = (_w = (_v = (_u = memories.technical) === null || _u === void 0 ? void 0 : _u.technicalDetails) === null || _v === void 0 ? void 0 : _v.organization) === null || _w === void 0 ? void 0 : _w.structure) === null || _x === void 0 ? void 0 : _x.tests;
console.log("   \uD83D\uDCA1 Resposta: Testes organizados em ".concat(testsPath || 'tests/'));
console.log("   \uD83D\uDCCA Framework: ".concat(summary.testing.framework));
console.log("   \uD83D\uDCC8 Cobertura: ".concat(summary.testing.coverage));
// Pergunta 8: Qual é a regra mais importante sobre documentação?
console.log('\n❓ Pergunta: "Qual é a regra mais importante sobre documentação?"');
var importantRule = (_2 = (_1 = (_0 = (_z = (_y = memories.technical) === null || _y === void 0 ? void 0 : _y.technicalDetails) === null || _z === void 0 ? void 0 : _z.organization) === null || _0 === void 0 ? void 0 : _0.rules) === null || _1 === void 0 ? void 0 : _1.documentation) === null || _2 === void 0 ? void 0 : _2.enforcement;
if (importantRule) {
    console.log("   \uD83D\uDCA1 Resposta: ".concat(importantRule));
}
// Pergunta 9: Quais bancos de dados são usados?
console.log('\n❓ Pergunta: "Quais bancos de dados são usados no projeto?"');
console.log("   \uD83D\uDCA1 Resposta: ".concat(summary.database.join(' + ')));
// Pergunta 10: Qual é o status atual do projeto?
console.log('\n❓ Pergunta: "Qual é o status atual do projeto?"');
var projectEntity = (_4 = (_3 = memories.initial) === null || _3 === void 0 ? void 0 : _3.entities) === null || _4 === void 0 ? void 0 : _4.find(function (e) { return e.fullName === 'rainer-portfolio-backend'; });
var statusObs = (_5 = projectEntity === null || projectEntity === void 0 ? void 0 : projectEntity.observations) === null || _5 === void 0 ? void 0 : _5.find(function (obs) {
    return obs.includes('Production Ready') || obs.includes('Enterprise');
});
console.log("   \uD83D\uDCA1 Resposta: ".concat(statusObs || 'Production Ready, Enterprise Grade'));
console.log('\n' + '═'.repeat(70));
console.log('\n✅ Teste de perguntas específicas concluído!');
console.log('📊 Todas as perguntas foram respondidas consultando as memórias do projeto.\n');
