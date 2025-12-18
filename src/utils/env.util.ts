/**
 * Utilitário para leitura de variáveis de ambiente
 * 
 * Contorna problemas de injeção do ConfigService lendo diretamente do process.env
 */

import dotenv from 'dotenv';
import path from 'path';

// Carregar .env explicitamente, sobrescrevendo variáveis do sistema
const result = dotenv.config({ 
  path: path.join(process.cwd(), '.env'),
  override: true
});
console.log('[EnvUtil] dotenv.config result:', result);
console.log('[EnvUtil] process.cwd():', process.cwd());
console.log('[EnvUtil] path.join:', path.join(process.cwd(), '.env'));
console.log('[EnvUtil] process.env.DATABASE_PROVIDER:', process.env.DATABASE_PROVIDER);

export class EnvUtil {
  static get(key: string, defaultValue?: string): string {
    const value = process.env[key] || defaultValue || '';
    if (key === 'DATABASE_PROVIDER') {
      console.log(`[EnvUtil] DATABASE_PROVIDER = "${value}"`);
    }
    return value;
  }

  static getNumber(key: string, defaultValue?: number): number {
    const value = process.env[key];
    if (!value) return defaultValue || 0;
    const num = parseInt(value, 10);
    return isNaN(num) ? (defaultValue || 0) : num;
  }

  static getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = process.env[key];
    if (!value) return defaultValue || false;
    return value.toLowerCase() === 'true';
  }
}
