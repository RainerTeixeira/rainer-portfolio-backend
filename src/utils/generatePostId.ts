/**
 * Gera um identificador único para um post baseado no timestamp atual e em um valor aleatório.
 * 
 * O identificador gerado é uma combinação do timestamp atual (em milissegundos) convertido para base 36 
 * e uma parte de um número aleatório também convertido para base 36.
 * Isso garante que o identificador seja único na maior parte dos casos, mas não é garantido como 100% único.
 * 
 * @returns {string} - Retorna um identificador único do tipo string.
 * 
 * @example
 * // Exemplo de uso:
 * const postId = generatePostId();
 * console.log(postId); // Saída pode ser algo como: "k8fr6uqwb3z"
 */
export const generatePostId = (): string => {
    // Gera o identificador usando a data atual em milissegundos (base 36) e um valor aleatório (base 36).
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
};
