# Configuração do Cloudinary para Imagens do Blog

## Variáveis de Ambiente

### Backend (.env)
```env
CLOUDINARY_URL=cloudinary://934767314247937:3pZivUQy8fbIwelf11FxR5NrHcw@dkt0xccga
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
# Cloudinary será usado via backend - não precisa de variável no frontend
```

## Funcionalidades Implementadas

✅ **Upload automático de imagens no Tiptap**
- Botão "Inserir Imagem" faz upload direto para Cloudinary
- **Drag & Drop**: Arraste imagens diretamente para o editor
- **Paste (Ctrl+V)**: Cole imagens da clipboard automaticamente

✅ **Otimização máxima WebP**
- Formato: WebP (até 30% menor que JPEG/PNG)
- Qualidade: `auto:best` (máxima compressão sem perder qualidade visual)
- Tamanho máximo: 1920px de largura (Full HD) - economiza espaço no plano gratuito
- Proporção mantida automaticamente

✅ **Economia de espaço no banco**
- **Apenas URL é salva** no banco (não base64)
- Formato Markdown compacto: `![alt](https://res.cloudinary.com/.../image.webp)`
- Base64 e data URIs são rejeitados - upload obrigatório

## Endpoint de Upload

### POST `/cloudinary/upload/blog-image`

**Request:**
- Content-Type: `multipart/form-data`
- Campo: `image` (arquivo de imagem)
- Limites: Máximo 5MB, formatos: JPG, PNG, GIF, WebP

**Response:**
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/dkt0xccga/image/upload/v1234567890/blog/timestamp-random.webp"
}
```

## Como Funciona no Tiptap

1. **Usuário insere imagem** (botão, drag & drop ou paste)
2. **Frontend valida** arquivo (tipo e tamanho)
3. **Placeholder visual** é inserido no editor (SVG temporário)
4. **Upload para Cloudinary** via backend
5. **URL otimizada** retorna do Cloudinary (WebP)
6. **Placeholder substituído** pela URL real
7. **Markdown gerado** com URL: `![alt](url)`
8. **Salvo no banco** apenas a URL (muito compacto)

## Otimizações Aplicadas

### Imagens do Blog
- **Largura máxima**: 1920px (Full HD)
- **Formato**: WebP otimizado
- **Qualidade**: `auto:best` (compressão inteligente)
- **Crop**: `limit` (mantém proporção)
- **Resultado**: Até 70% menor que JPEG original

### Comparação de Tamanho
- **Original JPEG 2MB** → **WebP otimizado ~600KB** (economiza 70%)
- **1000 imagens** no plano gratuito (25GB):
  - JPEG original: ~2GB
  - WebP otimizado: ~600MB (economiza 1.4GB = espaço para mais 2300 imagens!)

## Validações Implementadas

✅ Tamanho máximo: 5MB (blog) / 2MB (avatar)
✅ Formatos aceitos: JPG, PNG, GIF, WebP
✅ Apenas URLs HTTP/HTTPS são salvas (base64 rejeitado)
✅ Placeholder removido automaticamente em caso de erro

## Estrutura no Cloudinary

```
cloudinary://dkt0xccga/
├── avatars/
│   └── {cognitoSub}.webp (512x512px)
└── blog/
    └── {timestamp}-{random}.webp (max 1920px)
```

## URLs Geradas

As URLs seguem o formato otimizado:
```
https://res.cloudinary.com/dkt0xccga/image/upload/
  v{timestamp}/
  blog/
  {timestamp}-{random}.webp
```

Com todas as transformações aplicadas automaticamente pelo Cloudinary.

## Teste

1. Abra o editor no dashboard
2. Clique no botão "Inserir Imagem" ou arraste uma imagem
3. A imagem será enviada automaticamente para Cloudinary
4. Verifique no console: `✅ Imagem enviada para Cloudinary: [URL]`
5. Salve o post e verifique que apenas a URL está no banco (não base64)

