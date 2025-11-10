# Utilitários

## JSON Compressor

Utilitário de compressão otimizada de JSON do TipTap para armazenamento no MongoDB.

### Características

- **Redução de 50-60%** no tamanho do JSON
- **100% compatível** com TipTap Editor
- **Reversível** sem perda de dados
- **Otimização de mídia:**
  - URLs Cloudinary: apenas path essencial
  - YouTube: apenas video ID + timestamp

### Uso Básico

```typescript
import { compressContent, decompressContent } from '@/utils/json-compressor';

// Comprimir antes de salvar
const tiptapJSON = editor.getJSON();
const compressed = compressContent(tiptapJSON);

// Salvar no banco
await prisma.post.create({
  data: {
    content: compressed, // String JSON comprimida
    // ...
  }
});

// Descomprimir ao ler
const post = await prisma.post.findUnique({ where: { id } });
const expanded = decompressContent(post.content, {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME
});

// Usar no editor
editor.commands.setContent(expanded);
```

### Estatísticas de Compressão

```typescript
import { compressWithStats } from '@/utils/json-compressor';

const stats = compressWithStats(tiptapJSON);
console.log(`Redução: ${stats.reductionPercent}%`);
console.log(`Original: ${stats.originalSize} bytes`);
console.log(`Comprimido: ${stats.compressedSize} bytes`);
```

### Mapeamento de Chaves

| Original | Comprimido |
|----------|------------|
| `type` | `t` |
| `content` | `c` |
| `attrs` | `a` |
| `text` | `t` (contextual) |
| `level` | `l` |
| `src` | `s` |
| `alt` | `a` |
| `videoId` | `vid` |
| `startTime` | `st` |

### Mapeamento de Tipos de Nós

| Original | Comprimido |
|----------|------------|
| `doc` | `d` |
| `paragraph` | `p` |
| `heading` | `h` |
| `bulletList` | `ul` |
| `image` | `i` |
| `codeBlock` | `cb` |
| `table` | `tb` |
| `youtube` | `yt` |

### Exemplos

Veja exemplos completos em:
- `docs/JSON_COMPRESSION_EXAMPLES.md`
- `docs/examples/nestjs-post-compressed.json`
- `docs/examples/nestjs-post-expanded.json`

