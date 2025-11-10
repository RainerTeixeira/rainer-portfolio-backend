# ✅ Correções Aplicadas no Backend

## Problemas Identificados e Corrigidos

### 1. ✅ Limite de Upload Aumentado
**Arquivo:** `src/main.ts`
- **Antes:** `fileSize: 2 * 1024 * 1024` (2MB)
- **Depois:** `fileSize: 5 * 1024 * 1024` (5MB)
- **Motivo:** Necessário para upload de imagens do blog que podem ser maiores

### 2. ✅ CloudinaryModule Registrado
**Arquivo:** `src/app.module.ts`
- CloudinaryModule foi adicionado aos imports do AppModule
- Endpoint `/cloudinary/upload/blog-image` está disponível

### 3. ✅ Configuração Cloudinary
**Arquivo:** `.env`
- `CLOUDINARY_URL=cloudinary://934767314247937:3pZivUQy8fbIwelf11FxR5NrHcw@dkt0xccga`
- Configurado e testado no CloudinaryService

## Para Testar o Upload de Imagens

### Passos:
1. **Certifique-se que o MongoDB está rodando:**
   ```bash
   docker ps | grep mongo
   # Se não estiver, inicie:
   npm run docker:mongodb
   ```

2. **Inicie o backend:**
   ```bash
   npm run dev
   ```
   
   Aguarde a mensagem:
   ```
   🚀 NestJS + Fastify + MongoDB(Prisma)/DynamoDB + Zod
   Porta:          4000
   URL:            http://localhost:4000
   ```

3. **Teste o endpoint de upload:**
   ```bash
   curl -X POST http://localhost:4000/cloudinary/upload/blog-image \
     -F "image=@caminho/para/imagem.jpg"
   ```

4. **No frontend (porta 3002 ou 3000):**
   - Acesse: `http://localhost:3002/dashboard` (ou 3000)
   - Faça login
   - Crie um novo post
   - Clique em "Inserir Imagem" ou arraste uma imagem
   - A imagem será automaticamente enviada para Cloudinary

## Status Atual

- ✅ CloudinaryService configurado
- ✅ CloudinaryController criado
- ✅ Endpoint de upload implementado
- ✅ Tiptap Editor integrado com Cloudinary
- ✅ Limite de upload aumentado para 5MB
- ⚠️ Backend precisa ser iniciado manualmente (`npm run dev`)

## Próximos Passos para Testar

Quando o backend estiver rodando:

1. Acesse o dashboard: `http://localhost:3002/dashboard/login`
2. Faça login com suas credenciais
3. Clique em "Novo Post" ou acesse um post existente
4. No editor Tiptap, use:
   - **Botão "Inserir Imagem"** - abre seletor de arquivo
   - **Drag & Drop** - arraste imagem diretamente no editor
   - **Paste (Ctrl+V)** - cole imagem da clipboard
5. A imagem será automaticamente enviada para Cloudinary e otimizada
6. Apenas a URL será salva no banco (não base64)

## Troubleshooting

### Backend não inicia:
- Verifique se MongoDB está rodando: `docker ps`
- Verifique variáveis de ambiente: `.env`
- Verifique logs: `npm run dev` (sem background)

### Upload falha:
- Verifique `CLOUDINARY_URL` no `.env`
- Verifique tamanho do arquivo (máximo 5MB)
- Verifique formato (JPG, PNG, GIF, WebP)

### Frontend não conecta:
- Backend deve estar em `http://localhost:4000`
- Frontend pode estar em `http://localhost:3000` ou `3002`
- Verifique `NEXT_PUBLIC_API_URL` no `.env.local` do frontend

