# Guia de Teste: Criação de Post com Conteúdo Otimizado

Este guia explica como testar a criação de posts na UI usando o conteúdo otimizado do exemplo NestJS.

## Opção 1: Via Script (Backend)

Execute o script de teste que cria um post automaticamente:

```bash
# Com credenciais padrão
node test-create-post.js

# Ou com credenciais customizadas
node test-create-post.js seu-email@exemplo.com SuaSenha123!
```

### Requisitos

1. **Backend rodando** na porta 4000
2. **Usuário existente** no sistema (Cognito + MongoDB)
3. **Subcategoria criada** no banco de dados

### O que o script faz

1. ✅ Faz login e obtém token JWT
2. ✅ Busca informações do usuário atual
3. ✅ Busca primeira subcategoria disponível
4. ✅ Carrega conteúdo do exemplo NestJS
5. ✅ Cria post com conteúdo completo
6. ✅ Mostra estatísticas de compressão

## Opção 2: Via UI (Frontend)

### Passo 1: Acessar Dashboard

1. Acesse `http://localhost:3000/dashboard`
2. Faça login com suas credenciais

### Passo 2: Criar Novo Post

1. Clique em **"Novo Post"** ou acesse `/dashboard?mode=new`
2. Preencha os campos:
   - **Título**: `NestJS: Framework Node.js Escalável`
   - **Excerpt**: `NestJS revoluciona desenvolvimento backend com arquitetura modular inspirada no Angular.`
   - **Subcategoria**: Selecione uma subcategoria existente
   - **Cover Image**: (opcional) Upload de imagem

### Passo 3: Inserir Conteúdo

No editor TipTap, você pode:

#### Opção A: Copiar JSON Expandido

1. Abra `docs/examples/nestjs-post-expanded.json`
2. Copie todo o conteúdo JSON
3. No editor, clique em **"View JSON"** (ou pressione `Ctrl+Shift+J`)
4. Cole o JSON completo
5. O editor carregará automaticamente o conteúdo

#### Opção B: Criar Manualmente

1. **Heading H1**: "NestJS: Framework Node.js Escalável"
2. **Parágrafo**: "NestJS revoluciona desenvolvimento backend..."
3. **Imagem**: Inserir imagem do Cloudinary
4. **Heading H2**: "Principais Características"
5. **Lista**: 
   - Injeção de Dependência nativa
   - Arquitetura Modular
   - Suporte TypeScript
   - Decorators intuitivos
6. **YouTube**: Embed de vídeo (ID: `abc123xyz`)
7. **Code Block**: 
   ```javascript
   @Controller('users')
   export class UsersController {
     constructor(private usersService: UsersService) {}
   }
   ```
8. **Heading H2**: "Performance e Escalabilidade"
9. **Tabela**: Comparação de frameworks (NestJS vs Express)

### Passo 4: Salvar

1. Clique em **"Salvar Post"**
2. O post será salvo como DRAFT
3. O backend comprimirá automaticamente o JSON

### Passo 5: Verificar Compressão

1. Abra o console do navegador (F12)
2. Verifique a requisição POST para `/api/posts`
3. Compare o tamanho do payload enviado vs recebido

## Conteúdo do Exemplo

O exemplo inclui:

- ✅ Heading H1 e H2
- ✅ Parágrafos de texto
- ✅ Lista com bullets
- ✅ Imagem do Cloudinary
- ✅ Embed do YouTube
- ✅ Bloco de código
- ✅ Tabela de comparação

## Estrutura JSON

### Expandido (UI)
```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [...]
    }
  ]
}
```

### Comprimido (Banco)
```json
{
  "t": "d",
  "c": [
    {
      "t": "h",
      "l": 1,
      "c": [...]
    }
  ]
}
```

## Verificação

### No Banco de Dados

```javascript
// MongoDB
db.posts.findOne({ slug: "nestjs-framework-nodejs-escalavel-..." })

// Verificar campo content (JSON comprimido)
```

### No Frontend

1. Acesse o post criado
2. Verifique se todo o conteúdo renderiza corretamente
3. Confirme que imagens e vídeos funcionam

## Troubleshooting

### Erro: "Subcategoria não encontrada"

**Solução**: Crie uma subcategoria primeiro:
1. Acesse `/dashboard/categories`
2. Crie uma categoria principal
3. Crie uma subcategoria (filha)

### Erro: "Usuário não autenticado"

**Solução**: 
1. Faça login novamente
2. Verifique se o token JWT está válido

### Conteúdo não renderiza

**Solução**:
1. Verifique se o JSON está no formato correto
2. Confirme que todos os nós são suportados pelo TipTap
3. Veja o console do navegador para erros

## Estatísticas Esperadas

- **Tamanho Original**: ~3.1 KB
- **Tamanho Comprimido**: ~1.2 KB
- **Redução**: ~61%

## Próximos Passos

1. ✅ Criar post de teste
2. ✅ Verificar compressão no banco
3. ✅ Testar renderização no frontend
4. ✅ Publicar post (status: PUBLISHED)
5. ✅ Verificar performance

