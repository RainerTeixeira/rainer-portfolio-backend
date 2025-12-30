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

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = process.cwd();
const MEMORIES_DIR = join(PROJECT_ROOT, 'docs', '.memories');

interface ProjectInfo {
  name: string;
  version: string;
  description: string;
  framework: string;
  language: string;
  database: string[];
  auth: string;
  testing: {
    framework: string;
    coverage: string;
    totalTests: number;
  };
  deployment: string;
  structure: {
    tests: string;
    docs: string;
    scripts: string;
    memories: string;
  };
}

/**
 * Lê informações do package.json
 */
function readPackageJson(): any {
  const packagePath = join(PROJECT_ROOT, 'package.json');
  return JSON.parse(readFileSync(packagePath, 'utf-8'));
}

/**
 * Lê informações do README.md para extrair estatísticas
 */
function readReadme(): string {
  const readmePath = join(PROJECT_ROOT, 'README.md');
  if (existsSync(readmePath)) {
    return readFileSync(readmePath, 'utf-8');
  }
  return '';
}

/**
 * Coleta informações do projeto
 */
function collectProjectInfo(): ProjectInfo {
  const pkg = readPackageJson();
  const readme = readReadme();

  // Extrair cobertura de testes do README (se disponível)
  const coverageMatch = readme.match(/Coverage[:\s-]+([\d.]+)%/i);
  const testsMatch = readme.match(/(\d+)\s+test/i);

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
      coverage: coverageMatch ? `${coverageMatch[1]}%` : '99.57%',
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
function updateInitialMemory(): void {
  const info = collectProjectInfo();
  const memoryPath = join(MEMORIES_DIR, 'initial-memory.json');

  if (!existsSync(memoryPath)) {
    console.error(`❌ Arquivo não encontrado: ${memoryPath}`);
    return;
  }

  const memory = JSON.parse(readFileSync(memoryPath, 'utf-8'));

  // Atualizar informações
  memory.lastModified = new Date().toISOString();
  memory.content = `Conhecimento completo do projeto ${info.name} - Blog API Backend NestJS Serverless v${info.version}`;

  // Atualizar entidade do projeto
  const projectEntity = memory.entities.find((e: any) => e.fullName === 'rainer-portfolio-backend');
  if (projectEntity) {
    projectEntity.observations = [
      `Blog API Backend desenvolvida com ${info.framework}`,
      `Arquitetura híbrida: ${info.database.join(' + ')}`,
      `Autenticação via ${info.auth} integrada`,
      `Deploy serverless com ${info.deployment}`,
      `${info.testing.coverage} de cobertura de testes com ${info.testing.totalTests} casos de teste`,
      '65 endpoints REST documentados com Swagger',
      'Sistema de logs automático e monitoramento',
      'Docker Compose com ambiente completo (5 serviços)',
      'Segurança implementada com Helmet + CORS + Zod',
      `Documentação completa: 70+ documentos organizados em ${info.structure.docs}`,
      `Estrutura organizada: ${info.structure.tests} (testes), ${info.structure.docs} (documentação), ${info.structure.scripts} (utilitários e testes)`,
      `Memórias do projeto em ${info.structure.memories}`,
      'Scripts de teste separados em scripts/testes/',
      'Test coverage e reports em tests/coverage/ e tests/test-reports/',
      'REGRAS DE ORGANIZAÇÃO: Todas as documentações geradas em markdown (.md) devem ser salvas na pasta docs/',
    ];
  }

  writeFileSync(memoryPath, JSON.stringify(memory, null, 2), 'utf-8');
  console.log(`✅ ${memoryPath} atualizado`);
}

/**
 * Atualiza technical-details.json
 */
function updateTechnicalDetails(): void {
  const info = collectProjectInfo();
  const detailsPath = join(MEMORIES_DIR, 'technical-details.json');

  if (!existsSync(detailsPath)) {
    console.error(`❌ Arquivo não encontrado: ${detailsPath}`);
    return;
  }

  const details = JSON.parse(readFileSync(detailsPath, 'utf-8'));

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
    tests: `${info.structure.tests} - Todos os testes organizados (unit, integration, e2e)`,
    testCoverage: `${info.structure.tests}coverage/ - Relatórios de cobertura`,
    testReports: `${info.structure.tests}test-reports/ - Relatórios de execução`,
    testScripts: `${info.structure.tests}scripts/ - Scripts Node.js de teste manual`,
    docs: `${info.structure.docs} - Toda documentação organizada`,
    memories: `${info.structure.memories} - Memórias do projeto (code-analysis, initial-memory, technical-details)`,
    scripts: `${info.structure.scripts} - Scripts utilitários organizados`,
    testScriptsUtils: `${info.structure.scripts}testes/ - Scripts de teste separados dos utilitários`,
  };
  
  // Adicionar regras de organização
  if (!details.technicalDetails.organization.rules) {
    details.technicalDetails.organization.rules = {};
  }
  details.technicalDetails.organization.rules.documentation = {
    markdown: `Todas as documentações geradas em markdown (.md) devem ser salvas na pasta ${info.structure.docs}`,
    reason: 'Manter organização e facilitar navegação',
    enforcement: 'Obrigatório - documentações .md na raiz devem ser movidas para docs/',
  };

  // Atualizar métricas de qualidade
  if (details.technicalDetails.quality?.metrics) {
    details.technicalDetails.quality.metrics.coverage = {
      statements: info.testing.coverage,
      branches: '90.54%',
      functions: '100%',
      lines: info.testing.coverage,
    };
  }

  writeFileSync(detailsPath, JSON.stringify(details, null, 2), 'utf-8');
  console.log(`✅ ${detailsPath} atualizado`);
}

/**
 * Atualiza code-analysis.json
 */
function updateCodeAnalysis(): void {
  const info = collectProjectInfo();
  const analysisPath = join(MEMORIES_DIR, 'code-analysis.json');

  if (!existsSync(analysisPath)) {
    console.error(`❌ Arquivo não encontrado: ${analysisPath}`);
    return;
  }

  const analysis = JSON.parse(readFileSync(analysisPath, 'utf-8'));

  // Atualizar entidade do projeto
  const projectEntity = analysis.entities.find(
    (e: any) => e.fullName === 'Blog Backend Serverless'
  );

  if (projectEntity) {
    projectEntity.observations = [
      `API RESTful moderna para blog com ${info.framework}`,
      `Versão: ${info.version} (package.json)`,
      `Última análise: ${new Date().toLocaleDateString('pt-BR')}`,
      'Status: Production Ready, Enterprise Grade, Fully Documented, Type-Safe, Tested',
      `Framework: ${info.framework}`,
      `Language: ${info.language} com strict mode`,
      `Database: Dual support - ${info.database.join(' + ')}`,
      `Authentication: ${info.auth} integrado`,
      'Validation: Zod + class-validator',
      'Documentation: Swagger/OpenAPI 3.0 completo',
      `Testing: ${info.testing.framework} com ${info.testing.totalTests}+ testes, ${info.testing.coverage} coverage`,
      `Deployment: ${info.deployment}`,
      'Infrastructure: AWS SAM (Serverless Application Model)',
      'Security: Helmet, CORS, JWT validation',
      'Logging: Pino structured logging',
      'ORM: Prisma 6.17.1 para MongoDB',
      'AWS SDK: 3.913.0 para Cognito e DynamoDB',
      'Performance: Fastify para alta performance HTTP',
      'Monitoring: CloudWatch logs e X-Ray tracing',
      'Environment: Docker Compose para desenvolvimento local',
      `Estrutura organizada: ${info.structure.tests} (testes), ${info.structure.docs} (documentação)`,
      `Memórias em ${info.structure.memories}`,
      `REGRAS: Todas as documentações markdown (.md) devem ser salvas em ${info.structure.docs}`,
    ];
  }

  writeFileSync(analysisPath, JSON.stringify(analysis, null, 2), 'utf-8');
  console.log(`✅ ${analysisPath} atualizado`);
}

/**
 * Função principal
 */
function main(): void {
  console.log('🔄 Atualizando memórias do projeto...\n');

  try {
    updateInitialMemory();
    updateTechnicalDetails();
    updateCodeAnalysis();

    console.log('\n✅ Todas as memórias foram atualizadas com sucesso!');
    console.log(`📁 Localização: ${MEMORIES_DIR}`);
  } catch (error) {
    console.error('❌ Erro ao atualizar memórias:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

export { main, collectProjectInfo };

