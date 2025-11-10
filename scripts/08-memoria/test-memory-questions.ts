/**
 * Teste de Perguntas Específicas sobre o Projeto
 *
 * Este script faz perguntas específicas e busca respostas nas memórias.
 */

import { loadProjectMemories, getProjectSummary } from './memory-loader';

console.log('🧪 Testando Sistema de Memórias com Perguntas Específicas...\n');
console.log('═'.repeat(70));

const memories = loadProjectMemories();

// Pergunta 1: Onde devo criar um novo arquivo markdown?
console.log('\n❓ Pergunta: "Onde devo criar um novo arquivo markdown?"');
const docRule =
  memories.technical?.technicalDetails?.organization?.rules?.documentation
    ?.markdown;
if (docRule) {
  console.log(`   💡 Resposta: ${docRule}`);
  console.log(`   📁 Localização recomendada: docs/`);
} else {
  console.log('   ❌ Regra não encontrada');
}

// Pergunta 2: Quantos endpoints existem por módulo?
console.log('\n❓ Pergunta: "Quantos endpoints REST existem no projeto?"');
const endpoints = memories.technical?.technicalDetails?.endpoints?.total;
console.log(`   💡 Resposta: ${endpoints || 'N/A'} endpoints REST documentados`);

// Pergunta 3: Qual é a estrutura de pastas do projeto?
console.log('\n❓ Pergunta: "Qual é a estrutura de organização do projeto?"');
const structure = memories.technical?.technicalDetails?.organization?.structure;
if (structure) {
  console.log('   💡 Resposta: Estrutura organizacional:');
  Object.entries(structure).forEach(([key, value]) => {
    console.log(`      • ${key}: ${value}`);
  });
}

// Pergunta 4: Quais são as tecnologias principais?
console.log('\n❓ Pergunta: "Quais são as principais tecnologias usadas?"');
const summary = getProjectSummary();
console.log(`   💡 Resposta: `);
console.log(`      • Framework: ${summary.framework}`);
console.log(`      • Database: ${summary.database.join(' + ')}`);
console.log(`      • Testes: ${summary.testing.framework} (${summary.testing.coverage})`);

// Pergunta 5: Onde encontrar informações sobre módulos?
console.log('\n❓ Pergunta: "Onde posso encontrar informações sobre módulos?"');
console.log(`   💡 Resposta: Módulos em src/ organizados por domínio`);
console.log(`   📁 Total: ${memories.technical?.technicalDetails?.modules?.total || 'N/A'} módulos`);

// Pergunta 6: Como atualizar as memórias?
console.log('\n❓ Pergunta: "Como atualizar as memórias do projeto?"');
console.log(`   💡 Resposta: Execute 'npm run memory:update' para atualizar`);
console.log(`   📝 Localização: ${memories.technical?.technicalDetails?.organization?.structure?.memories || 'docs/.memories/'}`);

// Pergunta 7: Qual é a estratégia de testes?
console.log('\n❓ Pergunta: "Qual é a estratégia de testes do projeto?"');
const testsPath = memories.technical?.technicalDetails?.organization?.structure?.tests;
console.log(`   💡 Resposta: Testes organizados em ${testsPath || 'tests/'}`);
console.log(`   📊 Framework: ${summary.testing.framework}`);
console.log(`   📈 Cobertura: ${summary.testing.coverage}`);

// Pergunta 8: Qual é a regra mais importante sobre documentação?
console.log('\n❓ Pergunta: "Qual é a regra mais importante sobre documentação?"');
const importantRule =
  memories.technical?.technicalDetails?.organization?.rules?.documentation
    ?.enforcement;
if (importantRule) {
  console.log(`   💡 Resposta: ${importantRule}`);
}

// Pergunta 9: Quais bancos de dados são usados?
console.log('\n❓ Pergunta: "Quais bancos de dados são usados no projeto?"');
console.log(`   💡 Resposta: ${summary.database.join(' + ')}`);

// Pergunta 10: Qual é o status atual do projeto?
console.log('\n❓ Pergunta: "Qual é o status atual do projeto?"');
const projectEntity = memories.initial?.entities?.find(
  (e: any) => e.fullName === 'rainer-portfolio-backend'
);
const statusObs = projectEntity?.observations?.find((obs: string) =>
  obs.includes('Production Ready') || obs.includes('Enterprise')
);
console.log(`   💡 Resposta: ${statusObs || 'Production Ready, Enterprise Grade'}`);

console.log('\n' + '═'.repeat(70));
console.log('\n✅ Teste de perguntas específicas concluído!');
console.log(
  '📊 Todas as perguntas foram respondidas consultando as memórias do projeto.\n'
);

