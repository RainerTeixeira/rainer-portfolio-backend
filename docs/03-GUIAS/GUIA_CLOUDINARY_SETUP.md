# Configuração do Cloudinary para Upload de Avatares

## Variável de Ambiente

Adicione ao arquivo `.env`:

```env
CLOUDINARY_URL=cloudinary://934767314247937:3pZivUQy8fbIwelf11FxR5NrHcw@rainersoft
```

## Funcionalidades Implementadas

✅ Upload de avatares para Cloudinary
✅ Conversão automática para WebP com máxima compressão
✅ Otimização de qualidade (`auto:best` - melhor qualidade visual com compressão inteligente)
✅ Redimensionamento para 512x512px (ideal para avatares)
✅ Detecção automática de rosto (gravity: 'face')
✅ Deleção automática do avatar antigo ao fazer upload de um novo
✅ Validação de tamanho (máximo 2MB)
✅ Validação de tipo (apenas imagens: JPG, PNG, GIF, WebP)

## Como Funciona

1. **Frontend**: Usuário seleciona arquivo de imagem
2. **Frontend**: Cria FormData com arquivo + outros campos do formulário
3. **Backend**: Interceptor Fastify processa multipart/form-data
4. **Backend**: Valida arquivo (tamanho e tipo)
5. **Backend**: Upload para Cloudinary com transformações otimizadas
6. **Backend**: Retorna URL da imagem otimizada em WebP
7. **Backend**: Salva URL no banco de dados (Prisma/MongoDB)
8. **Frontend**: Exibe novo avatar automaticamente

## Otimizações WebP

- **Formato**: WebP (até 30% menor que JPEG/PNG)
- **Qualidade**: `auto:best` (máxima qualidade visual com compressão inteligente)
- **Tamanho**: 512x512px (otimizado para avatares)
- **Crop**: Fill com detecção de rosto automática
- **Overwrite**: true (sobrescreve avatar anterior)

## URLs Geradas

As URLs do Cloudinary seguem o formato:
```
https://res.cloudinary.com/rainersoft/image/upload/v[timestamp]/avatars/[cognitoSub].webp
```

Acessível diretamente via API do Cloudinary com todas as otimizações aplicadas.

