/**
 * Converte texto para formato slug (URL-friendly)
 * 
 * @param text Texto a ser convertido
 * @returns String em formato slug
 */
export function textToSlug(text: string): string {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Substitui espaços por -
    .replace(/[^\w\-]+/g, '')    // Remove todos os caracteres não word
    .replace(/\-\-+/g, '-')      // Substitui múltiplos - por um único -
    .replace(/^-+/, '')          // Remove - do início
    .replace(/-+$/, '');         // Remove - do fim
}

/**
 * Gera slug único baseado no título
 * 
 * @param title Título do post
 * @param existingSlugs Slugs já existentes (opcional)
 * @returns Slug único
 */
export function generateUniqueSlug(title: string, existingSlugs: string[] = []): string {
  let slug = textToSlug(title);
  
  // Se o slug já existe, adiciona um sufixo numérico
  if (existingSlugs.includes(slug)) {
    let counter = 1;
    let uniqueSlug = `${slug}-${counter}`;
    
    while (existingSlugs.includes(uniqueSlug)) {
      counter++;
      uniqueSlug = `${slug}-${counter}`;
    }
    
    return uniqueSlug;
  }
  
  return slug;
}
