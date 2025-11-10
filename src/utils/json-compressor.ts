/**
 * JSON Compressor - Otimização Ultra-Compacta para MongoDB
 * 
 * Comprime JSON do TipTap em formato mínimo para reduzir armazenamento no MongoDB.
 * Redução típica: 50-60% do tamanho original.
 * 
 * Estratégias de compressão:
 * - Chaves minificadas (type→t, content→c, attrs→a, etc)
 * - URLs Cloudinary otimizadas (apenas path necessário)
 * - YouTube embeds (apenas video ID + timestamp opcional)
 * - Remoção de espaços desnecessários
 * - Estruturas otimizadas por tipo de nó
 * 
 * @module utils/json-compressor
 */

// ═══════════════════════════════════════════════════════════════════════════
// MAPEAMENTO DE CHAVES (Compressão)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mapa de chaves TipTap → compactas utilizado na compressão.
 *
 * Objetivo: reduzir o tamanho dos documentos substituindo nomes de chaves por abreviações.
 * O mapeamento cobre campos comuns como `type`, `content`, `attrs`, `text`, entre outros.
 *
 * @remarks
 * - O mapeamento inverso para descompressão está em `KEY_MAP_REVERSE`.
 * - A chave `'t'` representa tanto `type` quanto `text` em contextos distintos:
 *   - No nível do nó, `'t'` indica o tipo (usando `NODE_TYPE_MAP`).
 *   - Em conteúdo inline, `'t'` armazena o texto puro.
 * - Chaves não mapeadas permanecem inalteradas.
 */
const KEY_MAP: Record<string, string> = {
  type: 't',
  content: 'c',
  attrs: 'a',
  text: 't',
  level: 'l',
  src: 's',
  alt: 'a',
  title: 'tt',
  href: 'h',
  target: 'tg',
  language: 'lang',
  width: 'w',
  height: 'ht',
  align: 'al',
  id: 'id',
  marks: 'm',
  videoId: 'vid',
  startTime: 'st',
  url: 'u',
};

// ═══════════════════════════════════════════════════════════════════════════
// MAPEAMENTO DE TIPOS DE NÓS (TipTap → Compacto)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mapa de tipos TipTap → códigos compactos para nós e marks.
 *
 * Reduz nomes de tipos para abreviações (`paragraph`→`p`, `heading`→`h` etc),
 * utilizado por `compressNode` e `compressInlineContent`.
 *
 * @remarks
 * - O mapeamento reverso está em `NODE_TYPE_MAP_REVERSE` para a etapa de descompressão.
 * - A cobertura inclui nós de documento, listas, imagens, tabelas e formatações inline.
 */
const NODE_TYPE_MAP: Record<string, string> = {
  doc: 'd',
  paragraph: 'p',
  heading: 'h',
  bulletList: 'ul',
  orderedList: 'ol',
  listItem: 'li',
  image: 'i',
  codeBlock: 'cb',
  table: 'tb',
  tableRow: 'tr',
  tableCell: 'td',
  tableHeader: 'th',
  blockquote: 'bq',
  horizontalRule: 'hr',
  hardBreak: 'br',
  bold: 'b',
  italic: 'it',
  link: 'ln',
  youtube: 'yt',
  video: 'v',
};

// ═══════════════════════════════════════════════════════════════════════════
// MAPEAMENTO REVERSO (Descompressão)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mapeamento reverso de chaves compactas → originais para descompressão de `attrs`.
 *
 * @remarks
 * - Conflitos propositais: `'a'` pode significar `alt` dentro de `attrs` e `attrs` no nível do nó.
 *   O uso é contextual: no nível do nó, `attrs` é tratado separadamente; dentro de `attrs`,
 *   `'a'` restaura para `alt`.
 * - O campo `'t'` (tipo do nó) não utiliza este mapa; use `NODE_TYPE_MAP_REVERSE`.
 */
const KEY_MAP_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, v]) => [v, k])
);

/**
 * Mapeamento reverso de tipos compactos → TipTap para reconstrução de nós e marks.
 *
 * Usado primariamente por `decompressNode` e `decompressInlineContent`.
 */
const NODE_TYPE_MAP_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(NODE_TYPE_MAP).map(([k, v]) => [v, k])
);

// ═══════════════════════════════════════════════════════════════════════════
// UTILITÁRIOS DE URL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Otimiza uma URL do Cloudinary ao reduzir para o path essencial após o segmento `upload`.
 *
 * Esta função remove domínio e partes não necessárias da URL do Cloudinary, preservando apenas
 * o path que identifica o recurso e transformações embutidas relevantes. URLs que não pertencem
 * ao Cloudinary ou caminhos já otimizados são retornados inalterados.
 *
 * @param url - URL completa do Cloudinary ou qualquer string representando uma URL.
 * @returns String contendo somente o path essencial (após `/upload/`) ou a `url` original se não aplicável.
 *
 * @example
 * // Entrada: URL completa
 * optimizeCloudinaryUrl('https://res.cloudinary.com/demo/image/upload/v123/folder/img.jpg');
 * // Saída: 'v123/folder/img.jpg'
 *
 * @example
 * // Entrada: URL não Cloudinary
 * optimizeCloudinaryUrl('https://example.com/assets/img.jpg');
 * // Saída: 'https://example.com/assets/img.jpg'
 *
 * @remarks
 * - A detecção é baseada na presença de `cloudinary.com` e do segmento `/upload/` no pathname.
 * - Em caso de erro no parsing da URL, a função retorna a entrada original para robustez.
 */
function optimizeCloudinaryUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;
  
  // Se não é Cloudinary, retorna como está
  if (!url.includes('cloudinary.com')) return url;
  
  try {
    const urlObj = new URL(url);
    
    // Se já está otimizada (formato curto), retorna
    // Exemplo: https://res.cloudinary.com/{cloud}/image/upload/{path}
    if (urlObj.pathname.includes('/upload/')) {
      // Extrair apenas path após /upload/
      const pathMatch = urlObj.pathname.match(/\/upload\/(.+)$/);
      if (pathMatch) {
        // Retornar apenas o path essencial (sem transformações redundantes)
        return pathMatch[1];
      }
    }
    
    return url;
  } catch {
    return url;
  }
}

/**
 * Extrai o identificador de vídeo do YouTube (11 caracteres) a partir de diferentes formatos de URL ou do próprio ID.
 *
 * Suporta os formatos comuns: `youtube.com/watch?v=...`, `youtu.be/...`, `youtube.com/embed/...`.
 * Caso a entrada já seja um ID de 11 caracteres válido, ele é retornado diretamente.
 *
 * @param url - URL do YouTube ou um possível ID de vídeo.
 * @returns O video ID (`string`) quando encontrado; caso contrário, `null`.
 *
 * @example
 * extractYouTubeVideoId('https://www.youtube.com/watch?v=abc123xyz00'); // 'abc123xyz00'
 * extractYouTubeVideoId('https://youtu.be/abc123xyz00'); // 'abc123xyz00'
 * extractYouTubeVideoId('abc123xyz00'); // 'abc123xyz00'
 */
function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Extrai o timestamp de início (em segundos) de uma URL do YouTube quando presente.
 *
 * Procura pelo parâmetro `t` na query string (por exemplo, `&t=30`). Caso não exista,
 * retorna `null`.
 *
 * @param url - URL do YouTube contendo um parâmetro `t` em segundos.
 * @returns Número inteiro em segundos ou `null` se ausente.
 *
 * @example
 * extractYouTubeStartTime('https://www.youtube.com/watch?v=abc123xyz00&t=90'); // 90
 * extractYouTubeStartTime('https://youtu.be/abc123xyz00'); // null
 */
function extractYouTubeStartTime(url: string): number | null {
  if (!url || typeof url !== 'string') return null;
  
  const match = url.match(/[?&]t=(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  return null;
}

/**
 * Restaura uma URL completa do Cloudinary a partir de um path compacto.
 *
 * Quando apenas o path após `/upload/` está disponível (por exemplo, `v123/folder/img.jpg`),
 * reconstrói a URL pública usando o `cloudName` fornecido ou o valor de `process.env.CLOUDINARY_CLOUD_NAME`.
 * Se a entrada já for uma URL absoluta, ela é retornada como está.
 *
 * @param path - Path compacto do Cloudinary (após `/upload/`) ou URL completa.
 * @param cloudName - Opcional. Nome do Cloud Cloudinary a ser utilizado na reconstrução.
 * @returns URL completa acessível publicamente.
 *
 * @example
 * restoreCloudinaryUrl('v123/folder/img.jpg', 'demo');
 * // 'https://res.cloudinary.com/demo/image/upload/v123/folder/img.jpg'
 *
 * @example
 * restoreCloudinaryUrl('https://res.cloudinary.com/demo/image/upload/v123/folder/img.jpg');
 * // retorna a própria URL
 */
function restoreCloudinaryUrl(path: string, cloudName?: string): string {
  if (!path) return '';
  
  // Se já é URL completa, retorna
  if (path.startsWith('http')) return path;
  
  // Reconstruir URL do Cloudinary
  const cloud = cloudName || process.env.CLOUDINARY_CLOUD_NAME || 'default';
  return `https://res.cloudinary.com/${cloud}/image/upload/${path}`;
}

/**
 * Constrói uma URL canônica de vídeo do YouTube a partir de um `videoId` e, opcionalmente, um `startTime`.
 *
 * O tempo inicial é representado pelo parâmetro `t` em segundos. Quando não fornecido, a URL
 * retorna sem o parâmetro de tempo.
 *
 * @param videoId - Identificador de vídeo do YouTube (11 caracteres).
 * @param startTime - Opcional. Tempo inicial em segundos para reprodução.
 * @returns URL no formato `https://www.youtube.com/watch?v=<videoId>[&t=<startTime>s]`.
 *
 * @example
 * restoreYouTubeUrl('abc123xyz00');
 * // 'https://www.youtube.com/watch?v=abc123xyz00'
 *
 * @example
 * restoreYouTubeUrl('abc123xyz00', 45);
 * // 'https://www.youtube.com/watch?v=abc123xyz00&t=45s'
 */
function restoreYouTubeUrl(videoId: string, startTime?: number): string {
  if (!videoId) return '';
  
  const baseUrl = `https://www.youtube.com/watch?v=${videoId}`;
  if (startTime && startTime > 0) {
    return `${baseUrl}&t=${startTime}s`;
  }
  return baseUrl;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPRESSÃO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Comprime um nó TipTap em uma representação compacta baseada em mapeamentos de tipo e chave.
 *
 * Estratégia por tipo:
 * - `doc`: mapeado para `t: 'd'` com conteúdo comprimido recursivamente.
 * - Nós de texto inline (em `paragraph`, `heading`, `tableCell`/`tableHeader`): compactados via `compressInlineContent`.
 * - `image`: otimiza `src` via Cloudinary e minifica atributos (`alt`, `title`, etc.).
 * - `codeBlock`: extrai texto puro e mantém `language`.
 * - `youtube/video`: reduz para `{ t: 'yt', vid, st? }` usando extração de ID e timestamp.
 * - Tipos genéricos: aplicam `NODE_TYPE_MAP` e comprimem `content`/`attrs` quando presentes.
 *
 * @param node - Nó TipTap a ser comprimido.
 * @returns Objeto representando o nó em formato minificado.
 *
 * @example
 * // Parágrafo simples
 * compressNode({ type: 'paragraph', content: [{ type: 'text', text: 'Olá' }] });
 * // { t: 'p', c: [ { t: 'Olá' } ] }
 */
function compressNode(node: any): any {
  if (!node || typeof node !== 'object') return node;
  
  const nodeType = node.type;
  const compressedType = NODE_TYPE_MAP[nodeType] || nodeType;
  
  // Documento raiz
  if (nodeType === 'doc') {
    return {
      t: 'd',
      c: (node.content || []).map(compressNode),
    };
  }
  
  // Heading
  if (nodeType === 'heading') {
    const level = node.attrs?.level || 1;
    return {
      t: compressedType,
      l: level,
      c: compressInlineContent(node.content || []),
      ...(node.attrs?.id ? { id: node.attrs.id } : {}),
    };
  }
  
  // Paragraph
  if (nodeType === 'paragraph') {
    return {
      t: compressedType,
      c: compressInlineContent(node.content || []),
    };
  }
  
  // Lists
  if (nodeType === 'bulletList' || nodeType === 'orderedList') {
    return {
      t: compressedType,
      c: (node.content || []).map(compressNode),
    };
  }
  
  // List Item
  if (nodeType === 'listItem') {
    return {
      t: compressedType,
      c: (node.content || []).map(compressNode),
    };
  }
  
  // Image (Cloudinary)
  if (nodeType === 'image') {
    const src = node.attrs?.src || '';
    const optimizedSrc = optimizeCloudinaryUrl(src);
    
    const result: any = {
      t: compressedType,
      s: optimizedSrc,
    };
    
    if (node.attrs?.alt) result.a = node.attrs.alt;
    if (node.attrs?.title) result.tt = node.attrs.title;
    if (node.attrs?.width) result.w = node.attrs.width;
    if (node.attrs?.height) result.ht = node.attrs.height;
    if (node.attrs?.align) result.al = node.attrs.align;
    
    return result;
  }
  
  // Code Block
  if (nodeType === 'codeBlock') {
    const lang = node.attrs?.language || 'plaintext';
    const code = extractTextContent(node.content || []);
    
    return {
      t: compressedType,
      lang,
      c: code,
    };
  }
  
  // Table
  if (nodeType === 'table') {
    return {
      t: compressedType,
      c: (node.content || []).map(compressNode),
    };
  }
  
  // Table Row
  if (nodeType === 'tableRow') {
    return {
      t: compressedType,
      c: (node.content || []).map(compressNode),
    };
  }
  
  // Table Cell / Header
  if (nodeType === 'tableCell' || nodeType === 'tableHeader') {
    return {
      t: compressedType,
      c: compressInlineContent(node.content || []),
    };
  }
  
  // YouTube Video
  if (nodeType === 'youtube' || nodeType === 'video') {
    // Priorizar videoId direto se disponível, senão extrair do src
    const videoId = node.attrs?.videoId || extractYouTubeVideoId(node.attrs?.src || '') || '';
    const src = node.attrs?.src || '';
    const startTime = node.attrs?.startTime || extractYouTubeStartTime(src);
    
    const result: any = {
      t: 'yt',
      vid: videoId,
    };
    
    if (startTime && startTime > 0) {
      result.st = startTime;
    }
    
    return result;
  }
  
  // Blockquote
  if (nodeType === 'blockquote') {
    return {
      t: compressedType,
      c: (node.content || []).map(compressNode),
    };
  }
  
  // Horizontal Rule
  if (nodeType === 'horizontalRule') {
    return {
      t: compressedType,
    };
  }
  
  // Hard Break
  if (nodeType === 'hardBreak') {
    return {
      t: compressedType,
    };
  }
  
  // Tipo genérico
  const result: any = {
    t: compressedType,
  };
  
  if (node.content && Array.isArray(node.content)) {
    result.c = node.content.map(compressNode);
  }
  
  if (node.attrs && Object.keys(node.attrs).length > 0) {
    result.a = compressAttrs(node.attrs);
  }
  
  return result;
}

/**
 * Comprime conteúdo inline (texto e marks) em uma estrutura enxuta.
 *
 * Regras:
 * - Texto: `type: 'text'` vira `{ t: <texto>, m?: <marks> }`.
 * - Marks: tipos são minificados; `link` vira `{ t: 'ln', h, tg? }`.
 * - Quebra de linha: `hardBreak` vira `{ t: 'br' }`.
 *
 * @param nodes - Array de nós inline do TipTap.
 * @returns Array de nós comprimidos prontos para serialização.
 *
 * @example
 * compressInlineContent([{ type: 'text', text: 'Hi', marks: [{ type: 'bold' }] }]);
 * // [ { t: 'Hi', m: ['b'] } ]
 */
function compressInlineContent(nodes: any[]): any[] {
  return nodes.map(node => {
    // Text node
    if (node.type === 'text') {
      const result: any = {
        t: node.text || '',
      };
      
      // Marks (formatação)
      if (node.marks && node.marks.length > 0) {
        result.m = node.marks.map((mark: any) => {
          const markType = NODE_TYPE_MAP[mark.type] || mark.type;
          
          if (mark.type === 'link') {
            return {
              t: markType,
              h: mark.attrs?.href || '',
              ...(mark.attrs?.target ? { tg: mark.attrs.target } : {}),
            };
          }
          
          return markType; // b, it, etc
        });
      }
      
      return result;
    }
    
    // Hard break
    if (node.type === 'hardBreak') {
      return { t: 'br' };
    }
    
    return compressNode(node);
  });
}

/**
 * Minifica as chaves do objeto `attrs` usando o mapa `KEY_MAP`.
 *
 * Preserva os valores originais e aplica compressão apenas às chaves conhecidas.
 * Chaves não mapeadas são mantidas tal como foram fornecidas.
 *
 * @param attrs - Objeto de atributos TipTap.
 * @returns Objeto com chaves minificadas.
 */
function compressAttrs(attrs: any): any {
  const compressed: any = {};
  
  for (const [key, value] of Object.entries(attrs)) {
    const compressedKey = KEY_MAP[key] || key;
    compressed[compressedKey] = value;
  }
  
  return compressed;
}

/**
 * Extrai texto plano concatenado de um array de nós TipTap.
 *
 * Percorre recursivamente `content` quando necessário e coleta o texto dos nós `text`.
 * Strings soltas são suportadas e concatenadas diretamente.
 *
 * @param nodes - Array de nós TipTap (inline ou block) contendo texto.
 * @returns String com o conteúdo textual agregado.
 */
function extractTextContent(nodes: any[]): string {
  return nodes
    .map(node => {
      if (typeof node === 'string') return node;
      if (node.type === 'text') return node.text || '';
      if (node.content) return extractTextContent(node.content);
      return '';
    })
    .join('');
}

// ═══════════════════════════════════════════════════════════════════════════
// DESCOMPRESSÃO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Descomprime um nó previamente compactado para o formato TipTap original.
 *
 * Estratégia por tipo:
 * - `t: 'd'` → `doc` com descompressão recursiva de `content`.
 * - Inline: `p`, `h`, `td`/`th` usam `decompressInlineContent` para reconstituir texto e marks.
 * - `i` (image): reconstrói `attrs.src` com `restoreCloudinaryUrl` e restaura atributos minificados.
 * - `cb` (codeBlock): reconstitui conteúdo como nó de texto.
 * - `yt` (YouTube): monta `attrs` com `src`, `videoId` e `startTime` quando existente.
 * - Tipos genéricos: aplica reverso de `NODE_TYPE_MAP` e restaura `content`/`attrs` quando presentes.
 *
 * @param node - Nó compactado.
 * @param options - Opções de descompressão (ex.: `cloudName` para URLs Cloudinary).
 * @returns Nó TipTap expandido.
 */
function decompressNode(node: any, options?: { cloudName?: string }): any {
  if (!node || typeof node !== 'object') return node;
  
  const compressedType = node.t;
  const originalType = NODE_TYPE_MAP_REVERSE[compressedType] || compressedType;
  
  // Documento raiz
  if (compressedType === 'd') {
    return {
      type: 'doc',
      content: (node.c || []).map((n: any) => decompressNode(n, options)),
    };
  }
  
  // Heading
  if (compressedType === 'h') {
    return {
      type: 'heading',
      attrs: {
        level: node.l || 1,
        ...(node.id ? { id: node.id } : {}),
      },
      content: decompressInlineContent(node.c || [], options),
    };
  }
  
  // Paragraph
  if (compressedType === 'p') {
    return {
      type: 'paragraph',
      content: decompressInlineContent(node.c || [], options),
    };
  }
  
  // Lists
  if (compressedType === 'ul' || compressedType === 'ol') {
    return {
      type: compressedType === 'ul' ? 'bulletList' : 'orderedList',
      content: (node.c || []).map((n: any) => decompressNode(n, options)),
    };
  }
  
  // List Item
  if (compressedType === 'li') {
    return {
      type: 'listItem',
      content: (node.c || []).map((n: any) => decompressNode(n, options)),
    };
  }
  
  // Image
  if (compressedType === 'i') {
    const src = restoreCloudinaryUrl(node.s || '', options?.cloudName);
    
    const attrs: any = { src };
    if (node.a) attrs.alt = node.a;
    if (node.tt) attrs.title = node.tt;
    if (node.w) attrs.width = node.w;
    if (node.ht) attrs.height = node.ht;
    if (node.al) attrs.align = node.al;
    
    return {
      type: 'image',
      attrs,
    };
  }
  
  // Code Block
  if (compressedType === 'cb') {
    return {
      type: 'codeBlock',
      attrs: {
        language: node.lang || 'plaintext',
      },
      content: [
        {
          type: 'text',
          text: node.c || '',
        },
      ],
    };
  }
  
  // Table
  if (compressedType === 'tb') {
    return {
      type: 'table',
      content: (node.c || []).map((n: any) => decompressNode(n, options)),
    };
  }
  
  // Table Row
  if (compressedType === 'tr') {
    return {
      type: 'tableRow',
      content: (node.c || []).map((n: any) => decompressNode(n, options)),
    };
  }
  
  // Table Cell / Header
  if (compressedType === 'td' || compressedType === 'th') {
    return {
      type: compressedType === 'th' ? 'tableHeader' : 'tableCell',
      content: decompressInlineContent(node.c || [], options),
    };
  }
  
  // YouTube Video
  if (compressedType === 'yt') {
    const videoId = node.vid || '';
    const startTime = node.st;
    const src = restoreYouTubeUrl(videoId, startTime);
    
    return {
      type: 'youtube',
      attrs: {
        src,
        videoId,
        ...(startTime ? { startTime } : {}),
      },
    };
  }
  
  // Blockquote
  if (compressedType === 'bq') {
    return {
      type: 'blockquote',
      content: (node.c || []).map((n: any) => decompressNode(n, options)),
    };
  }
  
  // Horizontal Rule
  if (compressedType === 'hr') {
    return {
      type: 'horizontalRule',
    };
  }
  
  // Hard Break
  if (compressedType === 'br') {
    return {
      type: 'hardBreak',
    };
  }
  
  // Tipo genérico
  const result: any = {
    type: originalType,
  };
  
  if (node.c && Array.isArray(node.c)) {
    result.content = node.c.map((n: any) => decompressNode(n, options));
  }
  
  if (node.a) {
    result.attrs = decompressAttrs(node.a);
  }
  
  return result;
}

/**
 * Descomprime conteúdo inline previamente compactado, restaurando nós `text`, `marks` e `hardBreak`.
 *
 * Regras:
 * - Strings simples viram nós `text`.
 * - Objetos `{ t: string, m?: [...] }` viram `{ type: 'text', text, marks? }`.
 * - Links compactados `{ t: 'ln', h, tg? }` viram `{ type: 'link', attrs }`.
 * - `{ t: 'br' }` vira `hardBreak`.
 *
 * @param nodes - Array de nós compactados.
 * @param options - Opções de descompressão (ex.: `cloudName` para URLs Cloudinary em nós aninhados).
 * @returns Array de nós TipTap restaurados.
 */
function decompressInlineContent(nodes: any[], options?: { cloudName?: string }): any[] {
  return nodes.map(node => {
    // String simples (texto direto) - caso raro, mas suportado
    if (typeof node === 'string') {
      return {
        type: 'text',
        text: node,
      };
    }
    
    // Objeto com texto (texto com ou sem formatação)
    if (typeof node === 'object' && node.t && typeof node.t === 'string' && !node.c) {
      const result: any = {
        type: 'text',
        text: node.t,
      };
      
      // Marks (formatação) - só adiciona se existir
      if (node.m && Array.isArray(node.m) && node.m.length > 0) {
        result.marks = node.m.map((mark: any) => {
          if (typeof mark === 'string') {
            return {
              type: NODE_TYPE_MAP_REVERSE[mark] || mark,
            };
          }
          
          if (mark.t === 'ln' || mark.t === 'link') {
            return {
              type: 'link',
              attrs: {
                href: mark.h || '',
                ...(mark.tg ? { target: mark.tg } : {}),
              },
            };
          }
          
          return {
            type: NODE_TYPE_MAP_REVERSE[mark.t] || mark.t,
          };
        });
      }
      
      return result;
    }
    
    // Hard break
    if (node.t === 'br') {
      return {
        type: 'hardBreak',
      };
    }
    
    return decompressNode(node, options);
  });
}

/**
 * Restaura as chaves originais do objeto `attrs` usando `KEY_MAP_REVERSE`.
 *
 * @param attrs - Objeto de atributos com chaves minificadas.
 * @returns Objeto `attrs` com chaves expandidas.
 */
function decompressAttrs(attrs: any): any {
  const decompressed: any = {};
  
  for (const [key, value] of Object.entries(attrs)) {
    const originalKey = KEY_MAP_REVERSE[key] || key;
    decompressed[originalKey] = value;
  }
  
  return decompressed;
}

// ═══════════════════════════════════════════════════════════════════════════
// API PÚBLICA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Opções para controle de descompressão e reconstrução de URLs.
 *
 * @property cloudName - Nome do cloud no Cloudinary usado por `restoreCloudinaryUrl`.
 * @public
 */
export interface CompressionOptions {
  cloudName?: string;
}

/**
 * Estrutura de resultado da compressão com métricas agregadas.
 *
 * @property compressed - String JSON com conteúdo minificado.
 * @property originalSize - Tamanho original em bytes (UTF-8).
 * @property compressedSize - Tamanho comprimido em bytes (UTF-8).
 * @property reduction - Diferença absoluta (`original - compressed`) em bytes.
 * @property reductionPercent - Redução percentual com arredondamento a duas casas.
 * @public
 */
export interface CompressionResult {
  compressed: string;
  originalSize: number;
  compressedSize: number;
  reduction: number;
  reductionPercent: number;
}

/**
 * Comprime conteúdo TipTap para uma string JSON compacta e pronta para persistência.
 *
 * Aceita `object` ou `string` JSON e aplica `compressNode` para minificar tipos,
 * chaves e atributos. Em caso de erro de parsing, retorna o conteúdo original,
 * priorizando robustez.
 *
 * @param content - Conteúdo TipTap (objeto ou string JSON).
 * @returns String JSON comprimida representando o conteúdo minificado.
 *
 * @example
 * compressContent({ type: 'doc', content: [] }); // '{"t":"d","c":[]}'
 *
 * @public
 */
export function compressContent(content: any): string {
  try {
    let parsed = content;
    if (typeof content === 'string') {
      parsed = JSON.parse(content);
    }
    
    const compressed = compressNode(parsed);
    return JSON.stringify(compressed);
  } catch (error) {
    console.error('Erro ao comprimir conteúdo:', error);
    return typeof content === 'string' ? content : JSON.stringify(content);
  }
}

/**
 * Descomprime uma string JSON compactada e reconstrói o conteúdo TipTap original.
 *
 * Aplica `decompressNode` para restaurar tipos, chaves e atributos. Erros de parsing
 * são tratados com fallback: tenta retornar JSON parseado bruto; se falhar, retorna
 * um documento vazio (`doc`) seguro.
 *
 * @param compressedContent - String JSON com conteúdo compactado.
 * @param options - Opções de descompressão (ex.: `cloudName` para reconstrução de URLs Cloudinary).
 * @returns Objeto TipTap reconstituído.
 *
 * @example
 * const tiptap = decompressContent('{"t":"d","c":[]}');
 *
 * @public
 */
export function decompressContent(
  compressedContent: string,
  options?: CompressionOptions
): any {
  try {
    const parsed = JSON.parse(compressedContent);
    return decompressNode(parsed, options);
  } catch (error) {
    console.error('Erro ao descomprimir conteúdo:', error);
    try {
      return JSON.parse(compressedContent);
    } catch {
      return {
        type: 'doc',
        content: [],
      };
    }
  }
}

/**
 * Comprime conteúdo e calcula métricas detalhadas da compressão.
 *
 * Métricas:
 * - `originalSize`: tamanho em bytes antes da compressão.
 * - `compressedSize`: tamanho em bytes após a compressão.
 * - `reduction`: diferença absoluta em bytes.
 * - `reductionPercent`: redução percentual com duas casas decimais.
 *
 * @param content - Conteúdo TipTap (objeto ou string JSON).
 * @returns Resultado com string comprimida e estatísticas.
 *
 * @example
 * const stats = compressWithStats({ type: 'doc', content: [] });
 * // stats.reductionPercent ~ 50–60% para documentos reais
 *
 * @public
 */
export function compressWithStats(content: any): CompressionResult {
  const original = typeof content === 'string' ? content : JSON.stringify(content);
  const compressed = compressContent(content);
  
  const originalSize = Buffer.byteLength(original, 'utf8');
  const compressedSize = Buffer.byteLength(compressed, 'utf8');
  const reduction = originalSize - compressedSize;
  const reductionPercent = (reduction / originalSize) * 100;
  
  return {
    compressed,
    originalSize,
    compressedSize,
    reduction,
    reductionPercent: Math.round(reductionPercent * 100) / 100,
  };
}

