#!/usr/bin/env node
/**
 * Memory Loader - Carrega e consolida memórias do projeto
 *
 * Este script carrega todas as memórias de docs/.memories/ e as consolida
 * para uso pelo Cursor AI ou outros sistemas MCP.
 *
 * Uso:
 *   node .cursor/memory-loader.mjs
 *   node .cursor/memory-loader.mjs --format json
 *   node .cursor/memory-loader.mjs --format text
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const MEMORIES_DIR = join(ROOT_DIR, 'docs', '.memories');

/**
 * Carrega todos os arquivos de memória
 */
function loadMemories() {
  const memories = {
    initial: null,
    technical: null,
    codeAnalysis: null,
    consolidated: null,
  };

  const files = [
    { key: 'initial', file: 'initial-memory.json' },
    { key: 'technical', file: 'technical-details.json' },
    { key: 'codeAnalysis', file: 'code-analysis.json' },
  ];

  for (const { key, file } of files) {
    const filePath = join(MEMORIES_DIR, file);
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        memories[key] = JSON.parse(content);
      } catch (error) {
        console.error(`Erro ao carregar ${file}:`, error.message);
      }
    }
  }

  return memories;
}

/**
 * Consolida todas as memórias em uma única estrutura
 */
function consolidateMemories(memories) {
  // Extrair informações do projeto das memórias
  const projectEntity = memories.initial?.entities?.find(
    (e) => e.fullName === 'rainer-portfolio-backend' || e.fullName === 'Blog Backend Serverless'
  ) || memories.codeAnalysis?.entities?.find(
    (e) => e.fullName === 'Blog Backend Serverless'
  );

  const version = memories.technical?.technicalDetails?.version || '4.1.0';
  const framework = 'NestJS 11 + Fastify 4';
  const language = 'TypeScript';

  const consolidated = {
    project: {
      name: 'rainer-portfolio-backend',
      version: version,
      type: 'backend',
      framework: framework,
      language: language,
      status: 'Production Ready',
      quality: 'Enterprise Grade',
    },
    entities: [],
    relations: [],
    technicalDetails: {},
    context: {},
    tags: [],
    summary: '',
  };

  // Consolidar entities
  if (memories.initial?.entities) {
    consolidated.entities.push(...memories.initial.entities);
  }
  if (memories.codeAnalysis?.entities) {
    // Evitar duplicatas
    const existingNames = new Set(consolidated.entities.map(e => e.fullName));
    memories.codeAnalysis.entities.forEach(entity => {
      if (!existingNames.has(entity.fullName)) {
        consolidated.entities.push(entity);
      }
    });
  }

  // Consolidar relations
  if (memories.initial?.relations) {
    consolidated.relations.push(...memories.initial.relations);
  }
  if (memories.codeAnalysis?.relations) {
    // Evitar duplicatas
    const existingRelations = new Set(
      consolidated.relations.map(r => `${r.from}-${r.to}-${r.relationType}`)
    );
    memories.codeAnalysis.relations.forEach(relation => {
      const key = `${relation.from}-${relation.to}-${relation.relationType}`;
      if (!existingRelations.has(key)) {
        consolidated.relations.push(relation);
      }
    });
  }

  // Consolidar technical details
  if (memories.technical?.technicalDetails) {
    consolidated.technicalDetails = memories.technical.technicalDetails;
  }

  // Consolidar context
  if (memories.initial?.context) {
    consolidated.context = {
      ...consolidated.context,
      ...memories.initial.context,
    };
  }

  // Consolidar tags
  if (memories.initial?.tags) {
    consolidated.tags.push(...memories.initial.tags);
  }
  if (memories.technical?.tags) {
    const existingTags = new Set(consolidated.tags);
    memories.technical.tags.forEach(tag => {
      if (!existingTags.has(tag)) {
        consolidated.tags.push(tag);
      }
    });
  }

  // Criar resumo
  consolidated.summary = generateSummary(memories);

  return consolidated;
}

/**
 * Gera um resumo textual das memórias
 */
function generateSummary(memories) {
  const parts = [];

  if (memories.initial) {
    parts.push(`Projeto: ${memories.initial.content || 'Blog API Backend NestJS Serverless'}`);
    if (memories.initial.context) {
      parts.push(`Status: ${memories.initial.context.projectStatus || 'Production Ready'}`);
      parts.push(`Qualidade: ${memories.initial.context.codeQuality || 'Enterprise Grade'}`);
    }
  }

  if (memories.technical?.technicalDetails) {
    const td = memories.technical.technicalDetails;
    if (td.endpoints) {
      parts.push(`Endpoints: ${td.endpoints.total || 'N/A'}`);
    }
    if (td.modules) {
      parts.push(`Módulos: ${td.modules.total || 'N/A'}`);
    }
    if (td.testing?.coverage) {
      parts.push(`Cobertura: ${td.testing.coverage || 'N/A'}`);
    }
  }

  return parts.join(' | ');
}

/**
 * Formata memórias como texto legível
 */
function formatAsText(consolidated) {
  const lines = [];

  lines.push('='.repeat(80));
  lines.push(`PROJETO: ${consolidated.project.name}`);
  lines.push(`Versão: ${consolidated.project.version}`);
  lines.push(`Status: ${consolidated.project.status}`);
  lines.push('='.repeat(80));
  lines.push('');
  lines.push(`RESUMO: ${consolidated.summary}`);
  lines.push('');

  if (consolidated.entities.length > 0) {
    lines.push('ENTIDADES:');
    lines.push('-'.repeat(80));
    consolidated.entities.forEach((entity, index) => {
      lines.push(`${index + 1}. ${entity.fullName} (${entity.entityType})`);
      if (entity.observations && entity.observations.length > 0) {
        entity.observations.slice(0, 3).forEach(obs => {
          lines.push(`   - ${obs}`);
        });
        if (entity.observations.length > 3) {
          lines.push(
            `   ... e mais ${entity.observations.length - 3} observações`
          );
        }
      }
      lines.push('');
    });
  }

  if (consolidated.technicalDetails) {
    lines.push('DETALHES TÉCNICOS:');
    lines.push('-'.repeat(80));
    if (consolidated.technicalDetails.endpoints) {
      lines.push(`Endpoints: ${consolidated.technicalDetails.endpoints.total}`);
    }
    if (consolidated.technicalDetails.modules) {
      lines.push(`Módulos: ${consolidated.technicalDetails.modules.total}`);
    }
    if (consolidated.technicalDetails.testing) {
      lines.push(`Cobertura: ${consolidated.technicalDetails.testing.coverage || 'N/A'}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// Main execution
const args = process.argv.slice(2);
const format =
  (args.includes('--format') && args[args.indexOf('--format') + 1]) || 'json';

try {
  const memories = loadMemories();
  const consolidated = consolidateMemories(memories);

  if (format === 'text') {
    console.log(formatAsText(consolidated));
  } else {
    // Salvar arquivo consolidado
    const outputPath = join(MEMORIES_DIR, 'consolidated-memory.json');
    writeFileSync(outputPath, JSON.stringify(consolidated, null, 2), 'utf-8');
    console.log(`✅ Memória consolidada salva em: ${outputPath}`);
    console.log(`📊 Entidades: ${consolidated.entities.length}`);
    console.log(`🔗 Relações: ${consolidated.relations.length}`);
    console.log(`📝 Resumo: ${consolidated.summary}`);
  }
} catch (error) {
  console.error('❌ Erro ao processar memórias:', error);
  process.exit(1);
}

