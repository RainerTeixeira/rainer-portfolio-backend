#!/bin/bash

# ========================================
# 🧪 SCRIPT DE TESTES - BLOG API
# ========================================
# Este script testa todas as rotas da API
# Use: bash test-api-curls.sh
# ========================================

BASE_URL="http://localhost:3000"
DB_PROVIDER="PRISMA"  # Altere para "DYNAMODB" se preferir

echo "========================================="
echo "🚀 INICIANDO TESTES DA API"
echo "========================================="
echo "Base URL: $BASE_URL"
echo "Database Provider: $DB_PROVIDER"
echo "========================================="
echo ""

# ========================================
# ❤️ HEALTH CHECK
# ========================================
echo "========================================="
echo "❤️ 1. HEALTH CHECK"
echo "========================================="

echo -e "\n📍 GET /health - Health Check Simples"
curl -X GET "$BASE_URL/health" \
  -H "X-Database-Provider: $DB_PROVIDER" \
  | jq .

echo -e "\n📍 GET /health/detailed - Health Check Detalhado"
curl -X GET "$BASE_URL/health/detailed" \
  -H "X-Database-Provider: $DB_PROVIDER" \
  | jq .

# ========================================
# 🔐 AUTENTICAÇÃO
# ========================================
echo -e "\n========================================="
echo "🔐 2. AUTENTICAÇÃO"
echo "========================================="

echo -e "\n📍 POST /auth/register - Registrar Usuário"
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -H "X-Database-Provider: $DB_PROVIDER" \
  -d '{
    "email": "teste@example.com",
    "password": "Senha123!@#",
    "username": "usuario_teste"
  }' | jq .

echo -e "\n📍 POST /auth/login - Login"
LOGIN_RESPONSE=$(curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Database-Provider: $DB_PROVIDER" \
  -d '{
    "email": "teste@example.com",
    "password": "Senha123!@#"
  }')
echo $LOGIN_RESPONSE | jq .

# Extrair token se disponível
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken // .access_token // ""')
REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.refreshToken // .refresh_token // ""')

if [ ! -z "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
  echo "✅ Token obtido com sucesso"
fi

echo -e "\n📍 POST /auth/refresh - Renovar Token"
curl -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -H "X-Database-Provider: $DB_PROVIDER" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }" | jq .

echo -e "\n📍 POST /auth/forgot-password - Esqueci Minha Senha"
curl -X POST "$BASE_URL/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -H "X-Database-Provider: $DB_PROVIDER" \
  -d '{
    "email": "teste@example.com"
  }' | jq .

# ========================================
# 👤 USUÁRIOS
# ========================================
echo -e "\n========================================="
echo "👤 3. USUÁRIOS"
echo "========================================="

echo -e "\n📍 POST /users - Criar Usuário"
USER_RESPONSE=$(curl -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -H "X-Database-Provider: $DB_PROVIDER" \
  -d '{
    "username": "rainer_dev",
    "email": "rainer@example.com",
    "password": "SenhaForte123!",
    "name": "Rainer Developer",
    "bio": "Desenvolvedor Full Stack",
    "avatar": "https://example.com/avatar.jpg",
    "role": "ADMIN"
  }')
echo $USER_RESPONSE | jq .

USER_ID=$(echo $USER_RESPONSE | jq -r '.id // .userId // ""')

echo -e "\n📍 GET /users - Listar Usuários"
curl -X GET "$BASE_URL/users?page=1&limit=10" \
  -H "X-Database-Provider: $DB_PROVIDER" \
  | jq .

if [ ! -z "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
  echo -e "\n📍 GET /users/$USER_ID - Buscar Usuário por ID"
  curl -X GET "$BASE_URL/users/$USER_ID" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .

  echo -e "\n📍 PUT /users/$USER_ID - Atualizar Usuário"
  curl -X PUT "$BASE_URL/users/$USER_ID" \
    -H "Content-Type: application/json" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    -d '{
      "name": "Rainer Developer Atualizado",
      "bio": "Desenvolvedor Full Stack Senior"
    }' | jq .
fi

echo -e "\n📍 GET /users/username/rainer_dev - Buscar por Username"
curl -X GET "$BASE_URL/users/username/rainer_dev" \
  -H "X-Database-Provider: $DB_PROVIDER" \
  | jq .

# ========================================
# 🏷️ CATEGORIAS
# ========================================
echo -e "\n========================================="
echo "🏷️ 4. CATEGORIAS"
echo "========================================="

echo -e "\n📍 POST /categories - Criar Categoria"
CATEGORY_RESPONSE=$(curl -X POST "$BASE_URL/categories" \
  -H "Content-Type: application/json" \
  -H "X-Database-Provider: $DB_PROVIDER" \
  -d '{
    "name": "Tecnologia",
    "slug": "tecnologia",
    "description": "Artigos sobre tecnologia e desenvolvimento"
  }')
echo $CATEGORY_RESPONSE | jq .

CATEGORY_ID=$(echo $CATEGORY_RESPONSE | jq -r '.id // .categoryId // ""')

echo -e "\n📍 POST /categories - Criar Subcategoria"
SUBCATEGORY_RESPONSE=$(curl -X POST "$BASE_URL/categories" \
  -H "Content-Type: application/json" \
  -H "X-Database-Provider: $DB_PROVIDER" \
  -d "{
    \"name\": \"JavaScript\",
    \"slug\": \"javascript\",
    \"description\": \"Artigos sobre JavaScript\",
    \"parentId\": \"$CATEGORY_ID\"
  }")
echo $SUBCATEGORY_RESPONSE | jq .

SUBCATEGORY_ID=$(echo $SUBCATEGORY_RESPONSE | jq -r '.id // .categoryId // ""')

echo -e "\n📍 GET /categories - Listar Categorias Principais"
curl -X GET "$BASE_URL/categories" \
  -H "X-Database-Provider: $DB_PROVIDER" \
  | jq .

if [ ! -z "$CATEGORY_ID" ] && [ "$CATEGORY_ID" != "null" ]; then
  echo -e "\n📍 GET /categories/$CATEGORY_ID - Buscar Categoria"
  curl -X GET "$BASE_URL/categories/$CATEGORY_ID" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .

  echo -e "\n📍 GET /categories/$CATEGORY_ID/subcategories - Listar Subcategorias"
  curl -X GET "$BASE_URL/categories/$CATEGORY_ID/subcategories" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .

  echo -e "\n📍 PUT /categories/$CATEGORY_ID - Atualizar Categoria"
  curl -X PUT "$BASE_URL/categories/$CATEGORY_ID" \
    -H "Content-Type: application/json" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    -d '{
      "description": "Artigos sobre tecnologia, desenvolvimento e inovação"
    }' | jq .
fi

echo -e "\n📍 GET /categories/slug/tecnologia - Buscar por Slug"
curl -X GET "$BASE_URL/categories/slug/tecnologia" \
  -H "X-Database-Provider: $DB_PROVIDER" \
  | jq .

# ========================================
# 📄 POSTS
# ========================================
echo -e "\n========================================="
echo "📄 5. POSTS"
echo "========================================="

echo -e "\n📍 POST /posts - Criar Post"
POST_RESPONSE=$(curl -X POST "$BASE_URL/posts" \
  -H "Content-Type: application/json" \
  -H "X-Database-Provider: $DB_PROVIDER" \
  -d "{
    \"title\": \"Guia Completo de NestJS\",
    \"slug\": \"guia-completo-nestjs\",
    \"content\": \"NestJS é um framework progressivo para Node.js...\",
    \"excerpt\": \"Aprenda tudo sobre NestJS neste guia completo\",
    \"authorId\": \"$USER_ID\",
    \"subcategoryId\": \"$SUBCATEGORY_ID\",
    \"featuredImage\": \"https://example.com/nestjs.jpg\",
    \"published\": false,
    \"tags\": [\"nestjs\", \"nodejs\", \"typescript\"]
  }")
echo $POST_RESPONSE | jq .

POST_ID=$(echo $POST_RESPONSE | jq -r '.id // .postId // ""')

echo -e "\n📍 GET /posts - Listar Posts"
curl -X GET "$BASE_URL/posts?page=1&limit=10&published=false" \
  -H "X-Database-Provider: $DB_PROVIDER" \
  | jq .

if [ ! -z "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
  echo -e "\n📍 GET /posts/$POST_ID - Buscar Post por ID"
  curl -X GET "$BASE_URL/posts/$POST_ID" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .

  echo -e "\n📍 PUT /posts/$POST_ID - Atualizar Post"
  curl -X PUT "$BASE_URL/posts/$POST_ID" \
    -H "Content-Type: application/json" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    -d '{
      "title": "Guia Completo de NestJS - Atualizado",
      "content": "NestJS é um framework progressivo para Node.js com TypeScript..."
    }' | jq .

  echo -e "\n📍 PATCH /posts/$POST_ID/publish - Publicar Post"
  curl -X PATCH "$BASE_URL/posts/$POST_ID/publish" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .
fi

echo -e "\n📍 GET /posts/slug/guia-completo-nestjs - Buscar Post por Slug"
curl -X GET "$BASE_URL/posts/slug/guia-completo-nestjs" \
  -H "X-Database-Provider: $DB_PROVIDER" \
  | jq .

if [ ! -z "$SUBCATEGORY_ID" ] && [ "$SUBCATEGORY_ID" != "null" ]; then
  echo -e "\n📍 GET /posts/subcategory/$SUBCATEGORY_ID - Posts por Subcategoria"
  curl -X GET "$BASE_URL/posts/subcategory/$SUBCATEGORY_ID" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .
fi

if [ ! -z "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
  echo -e "\n📍 GET /posts/author/$USER_ID - Posts por Autor"
  curl -X GET "$BASE_URL/posts/author/$USER_ID" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .
fi

# ========================================
# 💬 COMENTÁRIOS
# ========================================
echo -e "\n========================================="
echo "💬 6. COMENTÁRIOS"
echo "========================================="

echo -e "\n📍 POST /comments - Criar Comentário"
COMMENT_RESPONSE=$(curl -X POST "$BASE_URL/comments" \
  -H "Content-Type: application/json" \
  -H "X-Database-Provider: $DB_PROVIDER" \
  -d "{
    \"postId\": \"$POST_ID\",
    \"authorId\": \"$USER_ID\",
    \"content\": \"Excelente artigo! Muito bem explicado.\",
    \"approved\": false
  }")
echo $COMMENT_RESPONSE | jq .

COMMENT_ID=$(echo $COMMENT_RESPONSE | jq -r '.id // .commentId // ""')

if [ ! -z "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
  echo -e "\n📍 GET /comments/post/$POST_ID - Comentários do Post"
  curl -X GET "$BASE_URL/comments/post/$POST_ID" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .
fi

if [ ! -z "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
  echo -e "\n📍 GET /comments/user/$USER_ID - Comentários do Usuário"
  curl -X GET "$BASE_URL/comments/user/$USER_ID" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .
fi

if [ ! -z "$COMMENT_ID" ] && [ "$COMMENT_ID" != "null" ]; then
  echo -e "\n📍 GET /comments/$COMMENT_ID - Buscar Comentário"
  curl -X GET "$BASE_URL/comments/$COMMENT_ID" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .

  echo -e "\n📍 PATCH /comments/$COMMENT_ID/approve - Aprovar Comentário"
  curl -X PATCH "$BASE_URL/comments/$COMMENT_ID/approve" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .

  echo -e "\n📍 PUT /comments/$COMMENT_ID - Atualizar Comentário"
  curl -X PUT "$BASE_URL/comments/$COMMENT_ID" \
    -H "Content-Type: application/json" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    -d '{
      "content": "Excelente artigo! Muito bem explicado e detalhado."
    }' | jq .
fi

# ========================================
# ❤️ LIKES
# ========================================
echo -e "\n========================================="
echo "❤️ 7. LIKES"
echo "========================================="

echo -e "\n📍 POST /likes - Curtir Post"
LIKE_RESPONSE=$(curl -X POST "$BASE_URL/likes" \
  -H "Content-Type: application/json" \
  -H "X-Database-Provider: $DB_PROVIDER" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"postId\": \"$POST_ID\"
  }")
echo $LIKE_RESPONSE | jq .

if [ ! -z "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
  echo -e "\n📍 GET /likes/post/$POST_ID - Likes do Post"
  curl -X GET "$BASE_URL/likes/post/$POST_ID" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .

  echo -e "\n📍 GET /likes/post/$POST_ID/count - Contar Likes"
  curl -X GET "$BASE_URL/likes/post/$POST_ID/count" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .
fi

if [ ! -z "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
  echo -e "\n📍 GET /likes/user/$USER_ID - Likes do Usuário"
  curl -X GET "$BASE_URL/likes/user/$USER_ID" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .
fi

if [ ! -z "$USER_ID" ] && [ "$USER_ID" != "null" ] && [ ! -z "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
  echo -e "\n📍 GET /likes/$USER_ID/$POST_ID/check - Verificar Like"
  curl -X GET "$BASE_URL/likes/$USER_ID/$POST_ID/check" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .
fi

# ========================================
# 🔖 BOOKMARKS
# ========================================
echo -e "\n========================================="
echo "🔖 8. BOOKMARKS"
echo "========================================="

echo -e "\n📍 POST /bookmarks - Salvar Post"
BOOKMARK_RESPONSE=$(curl -X POST "$BASE_URL/bookmarks" \
  -H "Content-Type: application/json" \
  -H "X-Database-Provider: $DB_PROVIDER" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"postId\": \"$POST_ID\",
    \"collection\": \"Favoritos\",
    \"notes\": \"Ler depois com atenção\"
  }")
echo $BOOKMARK_RESPONSE | jq .

BOOKMARK_ID=$(echo $BOOKMARK_RESPONSE | jq -r '.id // .bookmarkId // ""')

if [ ! -z "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
  echo -e "\n📍 GET /bookmarks/user/$USER_ID - Bookmarks do Usuário"
  curl -X GET "$BASE_URL/bookmarks/user/$USER_ID" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .

  echo -e "\n📍 GET /bookmarks/user/$USER_ID/collection?collection=Favoritos - Bookmarks por Coleção"
  curl -X GET "$BASE_URL/bookmarks/user/$USER_ID/collection?collection=Favoritos" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .
fi

if [ ! -z "$BOOKMARK_ID" ] && [ "$BOOKMARK_ID" != "null" ]; then
  echo -e "\n📍 GET /bookmarks/$BOOKMARK_ID - Buscar Bookmark"
  curl -X GET "$BASE_URL/bookmarks/$BOOKMARK_ID" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .

  echo -e "\n📍 PUT /bookmarks/$BOOKMARK_ID - Atualizar Bookmark"
  curl -X PUT "$BASE_URL/bookmarks/$BOOKMARK_ID" \
    -H "Content-Type: application/json" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    -d '{
      "notes": "Artigo muito importante, revisar conceitos"
    }' | jq .
fi

# ========================================
# 🔔 NOTIFICAÇÕES
# ========================================
echo -e "\n========================================="
echo "🔔 9. NOTIFICAÇÕES"
echo "========================================="

echo -e "\n📍 POST /notifications - Criar Notificação"
NOTIFICATION_RESPONSE=$(curl -X POST "$BASE_URL/notifications" \
  -H "Content-Type: application/json" \
  -H "X-Database-Provider: $DB_PROVIDER" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"type\": \"COMMENT\",
    \"title\": \"Novo comentário\",
    \"message\": \"Você recebeu um novo comentário no seu post\",
    \"link\": \"/posts/$POST_ID\",
    \"read\": false
  }")
echo $NOTIFICATION_RESPONSE | jq .

NOTIFICATION_ID=$(echo $NOTIFICATION_RESPONSE | jq -r '.id // .notificationId // ""')

if [ ! -z "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
  echo -e "\n📍 GET /notifications/user/$USER_ID - Notificações do Usuário"
  curl -X GET "$BASE_URL/notifications/user/$USER_ID?page=1&limit=10" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .

  echo -e "\n📍 GET /notifications/user/$USER_ID/unread/count - Contar Não Lidas"
  curl -X GET "$BASE_URL/notifications/user/$USER_ID/unread/count" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .
fi

if [ ! -z "$NOTIFICATION_ID" ] && [ "$NOTIFICATION_ID" != "null" ]; then
  echo -e "\n📍 GET /notifications/$NOTIFICATION_ID - Buscar Notificação"
  curl -X GET "$BASE_URL/notifications/$NOTIFICATION_ID" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .

  echo -e "\n📍 PATCH /notifications/$NOTIFICATION_ID/read - Marcar como Lida"
  curl -X PATCH "$BASE_URL/notifications/$NOTIFICATION_ID/read" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .

  echo -e "\n📍 PUT /notifications/$NOTIFICATION_ID - Atualizar Notificação"
  curl -X PUT "$BASE_URL/notifications/$NOTIFICATION_ID" \
    -H "Content-Type: application/json" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    -d '{
      "read": true
    }' | jq .
fi

if [ ! -z "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
  echo -e "\n📍 PATCH /notifications/user/$USER_ID/read-all - Marcar Todas como Lidas"
  curl -X PATCH "$BASE_URL/notifications/user/$USER_ID/read-all" \
    -H "X-Database-Provider: $DB_PROVIDER" \
    | jq .
fi

# ========================================
# 🗑️ LIMPEZA (OPCIONAL - DELETAR DADOS)
# ========================================
echo -e "\n========================================="
echo "🗑️ 10. TESTES DE DELEÇÃO (OPCIONAL)"
echo "========================================="

read -p "Deseja executar os testes de deleção? (s/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
  if [ ! -z "$LIKE_ID" ] && [ "$LIKE_ID" != "null" ]; then
    echo -e "\n📍 DELETE /likes/$USER_ID/$POST_ID - Descurtir Post"
    curl -X DELETE "$BASE_URL/likes/$USER_ID/$POST_ID" \
      -H "X-Database-Provider: $DB_PROVIDER" \
      | jq .
  fi

  if [ ! -z "$BOOKMARK_ID" ] && [ "$BOOKMARK_ID" != "null" ]; then
    echo -e "\n📍 DELETE /bookmarks/$BOOKMARK_ID - Deletar Bookmark"
    curl -X DELETE "$BASE_URL/bookmarks/$BOOKMARK_ID" \
      -H "X-Database-Provider: $DB_PROVIDER" \
      | jq .
  fi

  if [ ! -z "$NOTIFICATION_ID" ] && [ "$NOTIFICATION_ID" != "null" ]; then
    echo -e "\n📍 DELETE /notifications/$NOTIFICATION_ID - Deletar Notificação"
    curl -X DELETE "$BASE_URL/notifications/$NOTIFICATION_ID" \
      -H "X-Database-Provider: $DB_PROVIDER" \
      | jq .
  fi

  if [ ! -z "$COMMENT_ID" ] && [ "$COMMENT_ID" != "null" ]; then
    echo -e "\n📍 DELETE /comments/$COMMENT_ID - Deletar Comentário"
    curl -X DELETE "$BASE_URL/comments/$COMMENT_ID" \
      -H "X-Database-Provider: $DB_PROVIDER" \
      | jq .
  fi

  if [ ! -z "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
    echo -e "\n📍 DELETE /posts/$POST_ID - Deletar Post"
    curl -X DELETE "$BASE_URL/posts/$POST_ID" \
      -H "X-Database-Provider: $DB_PROVIDER" \
      | jq .
  fi

  if [ ! -z "$SUBCATEGORY_ID" ] && [ "$SUBCATEGORY_ID" != "null" ]; then
    echo -e "\n📍 DELETE /categories/$SUBCATEGORY_ID - Deletar Subcategoria"
    curl -X DELETE "$BASE_URL/categories/$SUBCATEGORY_ID" \
      -H "X-Database-Provider: $DB_PROVIDER" \
      | jq .
  fi

  if [ ! -z "$CATEGORY_ID" ] && [ "$CATEGORY_ID" != "null" ]; then
    echo -e "\n📍 DELETE /categories/$CATEGORY_ID - Deletar Categoria"
    curl -X DELETE "$BASE_URL/categories/$CATEGORY_ID" \
      -H "X-Database-Provider: $DB_PROVIDER" \
      | jq .
  fi

  if [ ! -z "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
    echo -e "\n📍 DELETE /users/$USER_ID - Deletar Usuário"
    curl -X DELETE "$BASE_URL/users/$USER_ID" \
      -H "X-Database-Provider: $DB_PROVIDER" \
      | jq .
  fi
else
  echo "⏭️  Pulando testes de deleção"
fi

# ========================================
# ✅ FINALIZAÇÃO
# ========================================
echo -e "\n========================================="
echo "✅ TESTES CONCLUÍDOS!"
echo "========================================="
echo "Todos os endpoints foram testados."
echo "========================================="

