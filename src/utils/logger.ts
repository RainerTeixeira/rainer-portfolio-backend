/**
 * Logger
 * 
 * Configuração de logging para a aplicação.
 * Usa Pino para logs estruturados e performáticos.
 * Todos os logs são salvos automaticamente em logs/app.log
 * 
 * @module utils/logger
 */

import pino from 'pino';
import { env } from '../config/env.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Garantir que a pasta logs/ existe
const logsDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Logger configurado por ambiente
 * - Development: Console com pino-pretty + arquivo
 * - Production: Arquivo JSON estruturado
 */
export const logger = pino({
  level: env.LOG_LEVEL || 'info',
  transport: env.NODE_ENV === 'development' ? {
    targets: [
      // Console com cores (pino-pretty)
      {
        target: 'pino-pretty',
        level: 'info',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
      // Arquivo de log
      {
        target: 'pino/file',
        level: 'info',
        options: {
          destination: path.join(logsDir, 'app.log'),
          mkdir: true,
        },
      },
    ],
  } : {
    // Production: apenas arquivo
    target: 'pino/file',
    options: {
      destination: path.join(logsDir, 'app.log'),
      mkdir: true,
    },
  },
});
