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

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = process.cwd();
const MEMORIES_DIR = join(PROJECT_ROOT, 'docs', '.memories');

export interface ProjectMemories {
  initial: any;
  technical: any;
  code: any;
  loadedAt: string;
}

/**
 * Carrega todas as memórias do projeto
 */
export function loadProjectMemories(): ProjectMemories {
  const memories: Partial<ProjectMemories> = {
    loadedAt: new Date().toISOString(),
  };

  // Carregar initial-memory.json
  const initialPath = join(MEMORIES_DIR, 'initial-memory.json');
  if (existsSync(initialPath)) {
    try {
      memories.initial = JSON.parse(readFileSync(initialPath, 'utf-8'));
    } catch (error) {
      console.warn('⚠️ Erro ao carregar initial-memory.json:', error);
    }
  }

  // Carregar technical-details.json
  const technicalPath = join(MEMORIES_DIR, 'technical-details.json');
  if (existsSync(technicalPath)) {
    try {
      memories.technical = JSON.parse(readFileSync(technicalPath, 'utf-8'));
    } catch (error) {
      console.warn('⚠️ Erro ao carregar technical-details.json:', error);
    }
  }

  // Carregar code-analysis.json
  const codePath = join(MEMORIES_DIR, 'code-analysis.json');
  if (existsSync(codePath)) {
    try {
      memories.code = JSON.parse(readFileSync(codePath, 'utf-8'));
    } catch (error) {
      console.warn('⚠️ Erro ao carregar code-analysis.json:', error);
    }
  }

  return memories as ProjectMemories;
}

/**
 * Obtém resumo rápido do projeto
 */
export function getProjectSummary(): {
  name: string;
  version: string;
  description: string;
  framework: string;
  database: string[];
  testing: {
    framework: string;
    coverage: string;
  };
} {
  const memories = loadProjectMemories();

  // Extrair do initial-memory
  const projectEntity = memories.initial?.entities?.find(
    (e: any) => e.fullName === 'rainer-portfolio-backend'
  );

  return {
    name: projectEntity?.fullName || 'rainer-portfolio-backend',
    version: memories.technical?.technicalDetails?.version || '4.1.0',
    description: projectEntity?.observations?.[0] || 'Blog API Backend',
    framework: 'NestJS 11 + Fastify 4',
    database: ['MongoDB (Prisma)', 'DynamoDB (AWS SDK)'],
    testing: {
      framework: 'Jest',
      coverage: memories.technical?.technicalDetails?.quality?.metrics?.coverage?.lines || '99.57%',
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

export default loadProjectMemories;

