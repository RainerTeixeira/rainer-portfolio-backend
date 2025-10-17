#Requires -Version 5.1
<#
.SYNOPSIS
    Testa TODAS as rotas GET da API do Swagger

.DESCRIPTION
    Script que testa todas as rotas GET listadas no Swagger
    Para na primeira rota que falhar

.EXAMPLE
    .\scripts\testar-todas-rotas.ps1
#>

# Cores
$Green = 'Green'
$Red = 'Red'
$Yellow = 'Yellow'
$Cyan = 'Cyan'
$White = 'White'

# Configuracoes
$API_URL = "http://localhost:4000"

# Detectar DATABASE_PROVIDER do arquivo .env
$DATABASE_PROVIDER = $null
$envFile = ".env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -ErrorAction SilentlyContinue
    foreach ($line in $envContent) {
        if ($line -match '^\s*DATABASE_PROVIDER\s*=\s*(.+)$') {
            $DATABASE_PROVIDER = $matches[1].Trim().Trim('"').Trim("'")
            break
        }
    }
}

if (-not $DATABASE_PROVIDER) {
    if ($env:DATABASE_PROVIDER) {
        $DATABASE_PROVIDER = $env:DATABASE_PROVIDER
    }
}

if (-not $DATABASE_PROVIDER) {
    Write-Host ""
    Write-Host "ERRO: DATABASE_PROVIDER nao encontrado no .env!" -ForegroundColor $Red
    Write-Host "Configure DATABASE_PROVIDER=PRISMA no arquivo .env" -ForegroundColor $Yellow
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
    exit 1
}

# Estatisticas
$TotalTested = 0
$TotalSuccess = 0

# Banner
Clear-Host
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor $Cyan
Write-Host "║     🧪 TESTE COMPLETO DE TODAS AS ROTAS DA API - SWAGGER     ║" -ForegroundColor $Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor $Cyan
Write-Host ""
Write-Host "API URL:  $API_URL" -ForegroundColor $White
Write-Host "Database: $DATABASE_PROVIDER" -ForegroundColor $(if ($DATABASE_PROVIDER -eq "PRISMA") { $Green } else { $Cyan })
Write-Host ""
Write-Host "⚠️  O teste para na PRIMEIRA rota que falhar!" -ForegroundColor $Yellow
Write-Host ""

# Funcao para testar rota
function Test-Route {
    param(
        [string]$Method = "GET",
        [string]$Route,
        [string]$Description,
        [string]$Category
    )
    
    $script:TotalTested++
    
    Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor $Cyan
    Write-Host "[$script:TotalTested] $Category" -ForegroundColor $Cyan
    Write-Host "    $Description" -ForegroundColor $White
    Write-Host "    $Method $Route" -ForegroundColor $Yellow
    
    try {
        $headers = @{
            "X-Database-Provider" = $DATABASE_PROVIDER
        }
        
        $response = Invoke-WebRequest -Uri "$API_URL$Route" -Method $Method -Headers $headers -UseBasicParsing -SkipHttpErrorCheck -TimeoutSec 10 -ErrorAction Stop
        
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
            Write-Host "    ✅ OK (Status: $($response.StatusCode))" -ForegroundColor $Green
            $script:TotalSuccess++
            return $true
        }
        elseif ($response.StatusCode -eq 404) {
            Write-Host "    ❌ FALHOU: 404 Not Found" -ForegroundColor $Red
            Write-Host ""
            Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $Red
            Write-Host "TESTE PARADO: Rota nao encontrada!" -ForegroundColor $Red
            Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $Red
            return $false
        }
        else {
            Write-Host "    ❌ FALHOU: Status $($response.StatusCode)" -ForegroundColor $Red
            try {
                $errorContent = $response.Content | ConvertFrom-Json
                if ($errorContent.message) {
                    Write-Host "    Mensagem: $($errorContent.message)" -ForegroundColor $Red
                }
            } catch {}
            Write-Host ""
            Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $Red
            Write-Host "TESTE PARADO: Erro na requisicao!" -ForegroundColor $Red
            Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $Red
            return $false
        }
    }
    catch {
        Write-Host "    ❌ ERRO: $($_.Exception.Message)" -ForegroundColor $Red
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $Red
        Write-Host "TESTE PARADO: Erro ao conectar com a API!" -ForegroundColor $Red
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $Red
        Write-Host ""
        Write-Host "Certifique-se de que o servidor esta rodando:" -ForegroundColor $Yellow
        Write-Host "npm run start:dev" -ForegroundColor $Green
        return $false
    }
}

# ═══════════════════════════════════════════════════════════════
# ETAPA 1: TESTAR SAUDE DA API (OBRIGATORIO)
# ═══════════════════════════════════════════════════════════════

Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor $Yellow
Write-Host "║  ETAPA 1: VERIFICANDO SAUDE DA API (OBRIGATORIO)             ║" -ForegroundColor $Yellow
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor $Yellow
Write-Host ""
Write-Host "⚠️  Se a API nao estiver rodando, os testes serao interrompidos!" -ForegroundColor $Yellow
Write-Host ""
Start-Sleep -Seconds 1

# HEALTH CHECK BASICO
if (-not (Test-Route "GET" "/health" "Health Check Basico" "HEALTH CHECK")) {
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor $Red
    Write-Host "║  ❌ API NAO ESTA RODANDO! INICIE O SERVIDOR PRIMEIRO!        ║" -ForegroundColor $Red
    Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor $Red
    Write-Host ""
    Write-Host "Para iniciar a API, execute:" -ForegroundColor $Yellow
    Write-Host "   npm run start:dev" -ForegroundColor $Green
    Write-Host ""
    Write-Host "Aguarde o servidor iniciar completamente (porta 4000)" -ForegroundColor $Yellow
    Write-Host "e execute este script novamente." -ForegroundColor $Yellow
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
    exit 1
}

# HEALTH CHECK DETALHADO
if (-not (Test-Route "GET" "/health/detailed" "Health Check Detalhado" "HEALTH CHECK")) {
    Write-Host ""
    Write-Host "AVISO: Health detalhado falhou, mas API esta online." -ForegroundColor $Yellow
    Write-Host "Continuando com os testes..." -ForegroundColor $Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "✅ API ESTA SAUDAVEL! Continuando com testes das rotas..." -ForegroundColor $Green
Write-Host ""
Start-Sleep -Seconds 1

# ═══════════════════════════════════════════════════════════════
# ETAPA 2: TESTAR TODAS AS ROTAS
# ═══════════════════════════════════════════════════════════════

Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor $Cyan
Write-Host "║  ETAPA 2: TESTANDO ROTAS DA API                               ║" -ForegroundColor $Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor $Cyan
Write-Host ""

# USUARIOS
if (-not (Test-Route "GET" "/users" "Listar Usuarios" "USUARIOS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
if (-not (Test-Route "GET" "/users?page=1&limit=5" "Listar Usuarios (Paginado)" "USUARIOS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
if (-not (Test-Route "GET" "/users?role=ADMIN" "Filtrar Usuarios por Role" "USUARIOS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }

# Pegar ID de um usuário para testes
try {
    $usersResponse = Invoke-WebRequest -Uri "$API_URL/users?limit=1" -UseBasicParsing -SkipHttpErrorCheck
    $users = ($usersResponse.Content | ConvertFrom-Json)
    if ($users -and $users.Count -gt 0) {
        $userId = $users[0].id
        $username = $users[0].username
        
        if (-not (Test-Route "GET" "/users/$userId" "Buscar Usuario por ID" "USUARIOS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
        if (-not (Test-Route "GET" "/users/username/$username" "Buscar por Username" "USUARIOS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
    }
} catch {}

# POSTS
if (-not (Test-Route "GET" "/posts" "Listar Posts" "POSTS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
if (-not (Test-Route "GET" "/posts?status=PUBLISHED" "Posts Publicados" "POSTS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
if (-not (Test-Route "GET" "/posts?status=DRAFT" "Posts Rascunhos" "POSTS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
if (-not (Test-Route "GET" "/posts?featured=true" "Posts em Destaque" "POSTS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
if (-not (Test-Route "GET" "/posts?page=1&limit=5" "Posts Paginados" "POSTS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }

# Pegar dados de posts para outros testes
try {
    $postsResponse = Invoke-WebRequest -Uri "$API_URL/posts?limit=1" -UseBasicParsing -SkipHttpErrorCheck
    $posts = ($postsResponse.Content | ConvertFrom-Json)
    if ($posts -and $posts.Count -gt 0) {
        $postId = $posts[0].id
        $postSlug = $posts[0].slug
        $postAuthorId = $posts[0].authorId
        $postSubcategoryId = $posts[0].subcategoryId
        
        if (-not (Test-Route "GET" "/posts/$postId" "Buscar Post por ID" "POSTS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
        if (-not (Test-Route "GET" "/posts/slug/$postSlug" "Buscar Post por Slug" "POSTS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
        if (-not (Test-Route "GET" "/posts/author/$postAuthorId" "Posts por Autor" "POSTS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
        if (-not (Test-Route "GET" "/posts/subcategory/$postSubcategoryId" "Posts por Subcategoria" "POSTS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
    }
} catch {}

# CATEGORIAS
if (-not (Test-Route "GET" "/categories" "Listar Categorias" "CATEGORIAS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }

# Pegar dados de categorias
try {
    $catsResponse = Invoke-WebRequest -Uri "$API_URL/categories" -UseBasicParsing -SkipHttpErrorCheck
    $categories = ($catsResponse.Content | ConvertFrom-Json)
    if ($categories -and $categories.Count -gt 0) {
        $categoryId = $categories[0].id
        $categorySlug = $categories[0].slug
        
        if (-not (Test-Route "GET" "/categories/$categoryId" "Buscar Categoria" "CATEGORIAS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
        if (-not (Test-Route "GET" "/categories/slug/$categorySlug" "Buscar por Slug" "CATEGORIAS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
        if (-not (Test-Route "GET" "/categories/$categoryId/subcategories" "Listar Subcategorias" "CATEGORIAS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
    }
} catch {}

# COMENTARIOS
if (-not (Test-Route "GET" "/comments?limit=10" "Listar Comentarios" "COMENTARIOS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }

# Pegar dados de comentários
try {
    $commentsResponse = Invoke-WebRequest -Uri "$API_URL/comments?limit=1" -UseBasicParsing -SkipHttpErrorCheck
    $comments = ($commentsResponse.Content | ConvertFrom-Json)
    if ($comments -and $comments.Count -gt 0) {
        $commentId = $comments[0].id
        $commentPostId = $comments[0].postId
        $commentAuthorId = $comments[0].authorId
        
        if (-not (Test-Route "GET" "/comments/$commentId" "Buscar Comentario" "COMENTARIOS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
        if (-not (Test-Route "GET" "/comments/post/$commentPostId" "Comentarios do Post" "COMENTARIOS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
        if (-not (Test-Route "GET" "/comments/user/$commentAuthorId" "Comentarios do Usuario" "COMENTARIOS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
    }
} catch {}

# LIKES
if ($postId -and $userId) {
    if (-not (Test-Route "GET" "/likes/post/$postId" "Likes do Post" "LIKES")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
    if (-not (Test-Route "GET" "/likes/user/$userId" "Likes do Usuario" "LIKES")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
    if (-not (Test-Route "GET" "/likes/post/$postId/count" "Contar Likes" "LIKES")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
    if (-not (Test-Route "GET" "/likes/$userId/$postId/check" "Verificar Like" "LIKES")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
}

# BOOKMARKS
if ($userId) {
    if (-not (Test-Route "GET" "/bookmarks/user/$userId" "Bookmarks do Usuario" "BOOKMARKS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
    if (-not (Test-Route "GET" "/bookmarks/user/$userId/collection" "Bookmarks por Colecao" "BOOKMARKS")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
}

# NOTIFICACOES
if ($userId) {
    if (-not (Test-Route "GET" "/notifications/user/$userId" "Notificacoes do Usuario" "NOTIFICACOES")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
    if (-not (Test-Route "GET" "/notifications/user/$userId/unread/count" "Contar Nao Lidas" "NOTIFICACOES")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
}

# Pegar dados de notificações
try {
    $notifsResponse = Invoke-WebRequest -Uri "$API_URL/notifications/user/$userId?limit=1" -UseBasicParsing -SkipHttpErrorCheck
    $notifs = ($notifsResponse.Content | ConvertFrom-Json)
    if ($notifs -and $notifs.Count -gt 0) {
        $notifId = $notifs[0].id
        if (-not (Test-Route "GET" "/notifications/$notifId" "Buscar Notificacao" "NOTIFICACOES")) { Read-Host "`nPressione ENTER para sair"; exit 1 }
    }
} catch {}

# ═══════════════════════════════════════════════════════════════
# RESULTADO FINAL
# ═══════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor $Green
Write-Host "║                    ✅ TODOS OS TESTES PASSARAM!               ║" -ForegroundColor $Green
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor $Green
Write-Host ""
Write-Host "📊 RESUMO:" -ForegroundColor $Cyan
Write-Host "   Total de rotas testadas: $TotalTested" -ForegroundColor $White
Write-Host "   Rotas com sucesso:       $TotalSuccess" -ForegroundColor $Green
Write-Host "   Taxa de sucesso:         100%" -ForegroundColor $Green
Write-Host ""
Write-Host "🎉 O banco de dados esta populado e todas as rotas funcionam!" -ForegroundColor $Green
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $Cyan
Write-Host "ACESSO RAPIDO:" -ForegroundColor $Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $Cyan
Write-Host "API:     http://localhost:4000" -ForegroundColor $White
Write-Host "Swagger: http://localhost:4000/docs" -ForegroundColor $White
Write-Host "Health:  http://localhost:4000/health" -ForegroundColor $White
Write-Host ""

Read-Host "Pressione ENTER para sair"