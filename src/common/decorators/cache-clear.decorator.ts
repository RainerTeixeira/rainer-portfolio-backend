import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Decorador que limpa o cache para as chaves especificadas após a execução do método.
 *
 * @param {string[]} keys - Lista de chaves de cache a serem limpas. Suporta caracteres curinga '*' (ex: 'user:*').
 *
 * @returns {MethodDecorator} - O decorador de método.
 *
 * @example
 * ```typescript
 * @CacheClear(['user:*', 'settings'])
 * async updateUserSettings(userId: string, settings: any) {
 *     // lógica para atualizar configurações do usuário
 * }
 * ```
 *
 * Este decorador supõe que a instância do serviço contenha uma propriedade "cacheManager" injetada via
 * injeção de dependência, utilizando @Inject(CACHE_MANAGER) no construtor.
 *
 * Funcionamento:
 * 1. Após a execução do método original, ele obtém a instância do cacheManager presente em "this.cacheManager".
 * 2. Verifica se o cacheManager está definido; caso contrário, emite um aviso e retorna o resultado original.
 * 3. Verifica se o objeto "store" do cacheManager possui o método "keys". Se não estiver disponível, emite um aviso e pula a limpeza.
 * 4. Se o método "keys" estiver disponível, ele é utilizado para obter todas as chaves armazenadas no cache.
 * 5. Para cada padrão especificado:
 *    - Se o padrão contém o caractere curinga '*', converte-o em prefixo e filtra as chaves que iniciam com esse prefixo.
 *    - Caso contrário, utiliza a chave exata para remoção.
 * 6. Remove todas as chaves identificadas por meio do método "del".
 * 7. Registra mensagens de log via console para depuração.
 */
export function CacheClear(keys: string[]) {
    return (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) => {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            // Executa o método original e armazena o resultado
            const result = await originalMethod.apply(this, args);

            // Recupera a instância do cacheManager, que deve estar injetada na instância do serviço
            const cache = this.cacheManager;

            // Verifica se o cacheManager está definido
            if (!cache) {
                console.warn('cacheManager não encontrado na instância. Pulei a limpeza de cache.');
                return result;
            }

            // Verifica se o método "keys" está disponível na store do cacheManager
            if (!cache.store || typeof cache.store.keys !== 'function') {
                console.warn('Método keys não disponível no cacheManager.store. Pulei a limpeza de cache.');
                return result;
            }

            try {
                // Obtém todas as chaves do cache (suporta funções síncronas ou assíncronas)
                const allKeys = await Promise.resolve(cache.store.keys());

                // Para cada padrão especificado, filtra e remove as chaves correspondentes
                await Promise.all(
                    keys.map(async (pattern) => {
                        if (pattern.includes('*')) {
                            // Converte o padrão para um prefixo: ex: 'user:*' se torna 'user:'
                            const prefix = pattern.replace('*', '');
                            // Filtra as chaves que iniciam com o prefixo
                            const matchingKeys = allKeys.filter((k: string) => k.startsWith(prefix));
                            return Promise.all(matchingKeys.map((k: string) => cache.del(k)));
                        }
                        // Caso contrário, deleta a chave exata
                        return cache.del(pattern);
                    })
                );

                console.debug(`Caches com padrões [${keys.join(', ')}] foram limpos.`);
            } catch (err) {
                console.error('Erro ao limpar caches:', err);
            }

            // Retorna o resultado do método original
            return result;
        };

        return descriptor;
    };
}
