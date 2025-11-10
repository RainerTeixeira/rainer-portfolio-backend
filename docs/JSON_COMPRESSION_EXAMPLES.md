# Exemplos de Compressão JSON - NestJS Post

Este documento demonstra a compressão de JSON do TipTap para armazenamento otimizado no MongoDB.

## Estrutura de Compressão

### Mapeamento de Chaves
- `type` → `t`
- `content` → `c`
- `attrs` → `a`
- `text` → `t` (contextual)
- `level` → `l`
- `src` → `s`
- `alt` → `a`
- `title` → `tt`
- `href` → `h`
- `videoId` → `vid`
- `startTime` → `st`

### Mapeamento de Tipos de Nós
- `doc` → `d`
- `paragraph` → `p`
- `heading` → `h`
- `bulletList` → `ul`
- `orderedList` → `ol`
- `listItem` → `li`
- `image` → `i`
- `codeBlock` → `cb`
- `table` → `tb`
- `tableRow` → `tr`
- `tableCell` → `td`
- `youtube` → `yt`

---

## POST: "NestJS como Framework Backend"

### 1. VERSÃO COMPRIMIDA (Para Banco de Dados)

```json
{
  "t": "d",
  "c": [
    {
      "t": "h",
      "l": 1,
      "c": [{"t": "NestJS: Framework Node.js Escalável"}]
    },
    {
      "t": "p",
      "c": [{"t": "NestJS revoluciona desenvolvimento backend com arquitetura modular inspirada no Angular."}]
    },
    {
      "t": "i",
      "s": "v123/nest-architecture.jpg",
      "a": "Arquitetura NestJS",
      "tt": "Diagrama arquitetural"
    },
    {
      "t": "h",
      "l": 2,
      "c": [{"t": "Principais Características"}]
    },
    {
      "t": "ul",
      "c": [
        {
          "t": "li",
          "c": [{"t": "p", "c": [{"t": "Injeção de Dependência nativa"}]}]
        },
        {
          "t": "li",
          "c": [{"t": "p", "c": [{"t": "Arquitetura Modular"}]}]
        },
        {
          "t": "li",
          "c": [{"t": "p", "c": [{"t": "Suporte TypeScript"}]}]
        },
        {
          "t": "li",
          "c": [{"t": "p", "c": [{"t": "Decorators intuitivos"}]}]
        }
      ]
    },
    {
      "t": "yt",
      "vid": "abc123xyz",
      "st": 0
    },
    {
      "t": "cb",
      "lang": "javascript",
      "c": "@Controller('users')\nexport class UsersController {\n  constructor(private usersService: UsersService) {}\n}"
    },
    {
      "t": "h",
      "l": 2,
      "c": [{"t": "Performance e Escalabilidade"}]
    },
    {
      "t": "p",
      "c": [{"t": "Benchmarks mostram ganhos de 40% em throughput comparado a Express puro."}]
    },
    {
      "t": "tb",
      "c": [
        {
          "t": "tr",
          "c": [
            {
              "t": "th",
              "c": [{"t": "Framework"}]
            },
            {
              "t": "th",
              "c": [{"t": "RPS"}]
            },
            {
              "t": "th",
              "c": [{"t": "Latência"}]
            }
          ]
        },
        {
          "t": "tr",
          "c": [
            {
              "t": "td",
              "c": [{"t": "NestJS"}]
            },
            {
              "t": "td",
              "c": [{"t": "15.2k"}]
            },
            {
              "t": "td",
              "c": [{"t": "2.1ms"}]
            }
          ]
        },
        {
          "t": "tr",
          "c": [
            {
              "t": "td",
              "c": [{"t": "Express"}]
            },
            {
              "t": "td",
              "c": [{"t": "10.8k"}]
            },
            {
              "t": "td",
              "c": [{"t": "3.5ms"}]
            }
          ]
        }
      ]
    }
  ]
}
```

**Tamanho:** ~1.2 KB (comprimido)

---

### 2. VERSÃO EXPANDIDA (Para Referência/Desenvolvimento)

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": {
        "level": 1
      },
      "content": [
        {
          "type": "text",
          "text": "NestJS: Framework Node.js Escalável"
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "NestJS revoluciona desenvolvimento backend com arquitetura modular inspirada no Angular."
        }
      ]
    },
    {
      "type": "image",
      "attrs": {
        "src": "https://res.cloudinary.com/seu-cloud/image/upload/v123/nest-architecture.jpg",
        "alt": "Arquitetura NestJS",
        "title": "Diagrama arquitetural"
      }
    },
    {
      "type": "heading",
      "attrs": {
        "level": 2
      },
      "content": [
        {
          "type": "text",
          "text": "Principais Características"
        }
      ]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "Injeção de Dependência nativa"
                }
              ]
            }
          ]
        },
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "Arquitetura Modular"
                }
              ]
            }
          ]
        },
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "Suporte TypeScript"
                }
              ]
            }
          ]
        },
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "Decorators intuitivos"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "youtube",
      "attrs": {
        "src": "https://www.youtube.com/watch?v=abc123xyz",
        "videoId": "abc123xyz",
        "startTime": 0
      }
    },
    {
      "type": "codeBlock",
      "attrs": {
        "language": "javascript"
      },
      "content": [
        {
          "type": "text",
          "text": "@Controller('users')\nexport class UsersController {\n  constructor(private usersService: UsersService) {}\n}"
        }
      ]
    },
    {
      "type": "heading",
      "attrs": {
        "level": 2
      },
      "content": [
        {
          "type": "text",
          "text": "Performance e Escalabilidade"
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Benchmarks mostram ganhos de 40% em throughput comparado a Express puro."
        }
      ]
    },
    {
      "type": "table",
      "content": [
        {
          "type": "tableRow",
          "content": [
            {
              "type": "tableHeader",
              "content": [
                {
                  "type": "text",
                  "text": "Framework"
                }
              ]
            },
            {
              "type": "tableHeader",
              "content": [
                {
                  "type": "text",
                  "text": "RPS"
                }
              ]
            },
            {
              "type": "tableHeader",
              "content": [
                {
                  "type": "text",
                  "text": "Latência"
                }
              ]
            }
          ]
        },
        {
          "type": "tableRow",
          "content": [
            {
              "type": "tableCell",
              "content": [
                {
                  "type": "text",
                  "text": "NestJS"
                }
              ]
            },
            {
              "type": "tableCell",
              "content": [
                {
                  "type": "text",
                  "text": "15.2k"
                }
              ]
            },
            {
              "type": "tableCell",
              "content": [
                {
                  "type": "text",
                  "text": "2.1ms"
                }
              ]
            }
          ]
        },
        {
          "type": "tableRow",
          "content": [
            {
              "type": "tableCell",
              "content": [
                {
                  "type": "text",
                  "text": "Express"
                }
              ]
            },
            {
              "type": "tableCell",
              "content": [
                {
                  "type": "text",
                  "text": "10.8k"
                }
              ]
            },
            {
              "type": "tableCell",
              "content": [
                {
                  "type": "text",
                  "text": "3.5ms"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**Tamanho:** ~3.1 KB (expandido)

---

## Estatísticas de Compressão

- **Tamanho Original:** ~3.1 KB
- **Tamanho Comprimido:** ~1.2 KB
- **Redução:** ~1.9 KB
- **Percentual de Redução:** ~61%

---

## Otimizações Aplicadas

### 1. Cloudinary URLs
- **Antes:** `https://res.cloudinary.com/seu-cloud/image/upload/v123/nest-architecture.jpg`
- **Depois:** `v123/nest-architecture.jpg` (apenas path essencial)

### 2. YouTube Videos
- **Antes:** `https://www.youtube.com/watch?v=abc123xyz&t=0s`
- **Depois:** `{"vid": "abc123xyz", "st": 0}` (apenas ID + timestamp)

### 3. Chaves Minificadas
- `type` → `t`
- `content` → `c`
- `attrs` → `a`
- Redução de ~50% no tamanho das chaves

### 4. Tipos de Nós Compactos
- `heading` → `h`
- `paragraph` → `p`
- `codeBlock` → `cb`
- `table` → `tb`

---

## Uso no Backend

```typescript
import { compressContent, decompressContent } from '@/utils/json-compressor';

// Ao salvar no banco
const compressed = compressContent(tiptapJSON);

// Ao ler do banco
const expanded = decompressContent(compressed, {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME
});
```

---

## Compatibilidade

✅ **100% compatível com TipTap Editor**
- Estrutura preservada
- Todos os nós suportados
- Formatação mantida
- Links e mídia funcionais

✅ **Reversível**
- Descompressão sem perda de dados
- URLs restauradas automaticamente
- Formato original recuperável

