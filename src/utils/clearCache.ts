import { Cache } from 'cache-manager';

/**
 * Função responsável por limpar as chaves do cache que correspondem a determinados padrões.
 * 
 * @param {Cache} cache - O objeto de cache gerenciado pelo `cache-manager`.
 * @param {string[]} patterns - Um array de strings contendo os padrões a serem usados para filtrar as chaves do cache.
 * 
 * @returns {Promise<void>} - A função retorna uma `Promise` que, quando resolvida, indica que o cache foi limpo.
 * 
 * @example
 * // Exemplo de uso:
 * const cache: Cache = ... // Seu objeto de cache
 * const patterns: string[] = ['user:', 'session:'];
 * 
 * clearCache(cache, patterns)
 *   .then(() => console.log('Cache limpo com sucesso!'))
 *   .catch(err => console.error('Erro ao limpar o cache:', err));
 */
export const clearCache = async (cache: Cache, patterns: string[]): Promise<void> => {
  if (!cache || !patterns || patterns.length === 0) {
    return;
  }

  const keys: string[] = await cache.store.keys();
  const keysToDelete: string[] = [];

  for (const pattern of patterns) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of keys) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
  }

  for (const key of keysToDelete) {
    try {
      await cache.del(key);
      console.log(`Cache key "${key}" deleted.`);
    } catch (error) {
      console.error(`Error deleting cache key "${key}":`, error);
    }
  }
};
