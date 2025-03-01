import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Decorador que limpa o cache para as chaves especificadas após a execução do método.
 *
 * @param {string[]} keys - Lista de chaves de cache a serem limpas. Suporta caracteres curinga '*'.
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
 * Este decorador injeta o gerenciador de cache e redefine o método original para limpar
 * as chaves de cache especificadas após a execução do método. Se uma chave contiver '*',
 * todas as chaves correspondentes serão removidas.
 */
export function CacheClear(keys: string[]) {
    const cacheManager = Inject(CACHE_MANAGER);

    return (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) => {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const result = await originalMethod.apply(this, args);
            const cache: Cache = this.cacheManager;

            await Promise.all(
                keys.map(async (key) => {
                    if (key.includes('*')) {
                        const allKeys = await cache.store.keys?.() || [];
                        const matchingKeys = allKeys.filter(k => k.startsWith(key.replace('*', '')));
                        return Promise.all(matchingKeys.map(k => cache.del(k)));
                    }
                    return cache.del(key);
                })
            );

            return result;
        };

        return descriptor;
    };
}