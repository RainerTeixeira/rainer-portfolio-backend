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
    // Inicializa a variável keys como um array vazio de strings.
    let keys: string[] = [];

    // Verifica se o objeto cache.store existe e se a função keys está disponível.
    if (cache.store && typeof cache.store.keys === 'function') {
        // Chama cache.store.keys() para obter todas as chaves armazenadas no cache.
        keys = await cache.store.keys() as string[];
    }

    // Filtra as chaves que correspondem a qualquer um dos padrões fornecidos.
    const matches = keys.filter(key =>
        patterns.some(pattern => key.includes(pattern)) // Verifica se a chave contém algum dos padrões.
    );

    // Para cada chave que corresponde aos padrões, deleta a chave do cache.
    await Promise.all(matches.map(key => cache.del(key)));
};
