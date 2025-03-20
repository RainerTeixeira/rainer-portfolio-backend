import { Cache } from 'cache-manager';

/**
 * Decorador que limpa o cache para as chaves especificadas após a execução do método.
 *
 * Este decorador utiliza expressões regulares para identificar e remover chaves de cache que
 * correspondem a um ou mais padrões especificados.
 *
 * @param {string[]} keys - Lista de padrões de chave de cache a serem limpas. Suporta curingas '*' (ex: 'user:*').
 * @returns {MethodDecorator} - O decorador de método.
 *
 * @example
 * ```typescript
 * @CacheClear(['user:*', 'settings'])
 * async updateUserSettings(userId: string, settings: unknown) {
 * // ... lógica para atualizar configurações do usuário
 * }
 * ```
 *
 * Este decorador assume que a instância do serviço possui uma propriedade "cacheManager" injetada via
 * injeção de dependência, utilizando @Inject(CACHE_MANAGER) no construtor.
 */
export function CacheClear(keys: string[]): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function <T extends unknown[]>(...args: T) {
      const result = await originalMethod.apply(this, args);
      const cache: Cache = this['cacheManager'];

      if (!cache) {
        console.warn('cacheManager não encontrado. Limpeza de cache pulada.');
        return result;
      }

      try {
        const allKeys: string[] = await cache.store.keys();
        const regexPatterns: RegExp[] = keys.map(pattern => {
          const regexPattern = pattern.replace(/\*/g, '.*');
          return new RegExp(`^${regexPattern}$`);
        });

        const keysToDelete: string[] = allKeys.filter(key =>
          regexPatterns.some(regex => regex.test(key))
        );

        await Promise.all(keysToDelete.map(key => cache.del(key)));
        console.debug(`Cache limpo após execução de ${propertyKey.toString()}. Chaves removidas: ${keysToDelete.join(', ')}`);
      } catch (error) {
        console.error(`Erro ao limpar cache após ${propertyKey.toString()}:`, error);
      }

      return result;
    };

    return descriptor;
  };
}
