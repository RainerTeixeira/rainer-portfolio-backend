# 🚀 Guia Rápido: Criar Post de Teste na UI

## Passo a Passo Simplificado

### 1️⃣ Acesse o Dashboard

```
http://localhost:3000/dashboard
```

### 2️⃣ Faça Login

Use suas credenciais do Cognito.

### 3️⃣ Clique em "Novo Post"

Ou acesse diretamente: `/dashboard?mode=new`

### 4️⃣ Preencha os Campos Básicos

- **Título**: `NestJS: Framework Node.js Escalável`
- **Excerpt**: `NestJS revoluciona desenvolvimento backend com arquitetura modular inspirada no Angular.`
- **Subcategoria**: Selecione uma subcategoria existente (ou crie uma antes)

### 5️⃣ Cole o JSON no Editor

1. No editor TipTap, pressione **`Ctrl+Shift+J`** (ou clique em "View JSON")
2. Aparecerá um modal com o JSON do conteúdo
3. **Delete tudo** e cole o conteúdo abaixo:

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "NestJS: Framework Node.js Escalável" }]
    },
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "NestJS revoluciona desenvolvimento backend com arquitetura modular inspirada no Angular." }]
    },
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "Principais Características" }]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [{
            "type": "paragraph",
            "content": [{ "type": "text", "text": "Injeção de Dependência nativa" }]
          }]
        },
        {
          "type": "listItem",
          "content": [{
            "type": "paragraph",
            "content": [{ "type": "text", "text": "Arquitetura Modular" }]
          }]
        },
        {
          "type": "listItem",
          "content": [{
            "type": "paragraph",
            "content": [{ "type": "text", "text": "Suporte TypeScript" }]
          }]
        },
        {
          "type": "listItem",
          "content": [{
            "type": "paragraph",
            "content": [{ "type": "text", "text": "Decorators intuitivos" }]
          }]
        }
      ]
    },
    {
      "type": "codeBlock",
      "attrs": { "language": "javascript" },
      "content": [{
        "type": "text",
        "text": "@Controller('users')\nexport class UsersController {\n  constructor(private usersService: UsersService) {}\n}"
      }]
    },
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "Performance e Escalabilidade" }]
    },
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Benchmarks mostram ganhos de 40% em throughput comparado a Express puro." }]
    },
    {
      "type": "table",
      "content": [
        {
          "type": "tableRow",
          "content": [
            { "type": "tableHeader", "content": [{ "type": "text", "text": "Framework" }] },
            { "type": "tableHeader", "content": [{ "type": "text", "text": "RPS" }] },
            { "type": "tableHeader", "content": [{ "type": "text", "text": "Latência" }] }
          ]
        },
        {
          "type": "tableRow",
          "content": [
            { "type": "tableCell", "content": [{ "type": "text", "text": "NestJS" }] },
            { "type": "tableCell", "content": [{ "type": "text", "text": "15.2k" }] },
            { "type": "tableCell", "content": [{ "type": "text", "text": "2.1ms" }] }
          ]
        },
        {
          "type": "tableRow",
          "content": [
            { "type": "tableCell", "content": [{ "type": "text", "text": "Express" }] },
            { "type": "tableCell", "content": [{ "type": "text", "text": "10.8k" }] },
            { "type": "tableCell", "content": [{ "type": "text", "text": "3.5ms" }] }
          ]
        }
      ]
    }
  ]
}
```

4. Clique em **"Aplicar"** ou **"Update"**
5. O editor carregará o conteúdo automaticamente

### 6️⃣ Visualize o Preview

Clique em **"Preview"** para ver como ficará o post.

### 7️⃣ Salve o Post

Clique em **"Salvar Post"** (botão azul no topo).

### 8️⃣ Verifique o Resultado

1. O post será salvo como **DRAFT**
2. Você verá uma mensagem de sucesso
3. O post aparecerá na lista de posts

## 📊 O que o Backend Faz

Quando você salva, o backend:
1. ✅ Recebe o JSON expandido
2. ✅ Comprime automaticamente (se configurado)
3. ✅ Salva no MongoDB no formato otimizado
4. ✅ Reduz ~60% do tamanho

## 🎯 Verificação

### Ver no Banco

```javascript
// MongoDB Compass ou CLI
db.posts.findOne({ title: "NestJS: Framework Node.js Escalável" })

// Verificar campo content (JSON comprimido)
```

### Ver na UI

1. Acesse a lista de posts
2. Clique no post criado
3. Verifique se todo o conteúdo renderiza corretamente

## 📝 Conteúdo Completo

Para o conteúdo completo com imagens e YouTube, use o arquivo:
- `docs/examples/nestjs-post-expanded.json`

## ⚠️ Troubleshooting

### "Subcategoria obrigatória"
- Crie uma subcategoria primeiro em `/dashboard/categories`

### JSON não carrega
- Verifique se o JSON está válido (use um validador JSON online)
- Certifique-se de copiar o JSON completo (incluindo `{` e `}`)

### Conteúdo não renderiza
- Verifique o console do navegador (F12)
- Confirme que todos os nós são suportados pelo TipTap

## ✅ Checklist

- [ ] Dashboard acessível
- [ ] Login realizado
- [ ] Subcategoria criada
- [ ] JSON colado no editor
- [ ] Preview visualizado
- [ ] Post salvo com sucesso
- [ ] Post visível na lista

---

**Pronto!** 🎉 Você criou um post de teste com conteúdo otimizado.

