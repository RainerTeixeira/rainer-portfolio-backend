#Requires -Version 5.1
<#
.SYNOPSIS
    Testa TODAS as rotas da API com operações CRUD completas

.DESCRIPTION
    Script unificado que testa todas as rotas da API do Blog
    - Health Check
    - Autenticação (registro, login, refresh)
    - CRUD completo de Usuários
    - CRUD completo de Categorias e Subcategorias
    - CRUD completo de Posts
    - CRUD completo de Comentários
    - Likes, Bookmarks e Notificações
    - Opção de deletar dados de teste

.EXAMPLE
    .\scripts\testar-todas-rotas-completo.ps1
    
.EXAMPLE
    .\scripts\testar-todas-rotas-completo.ps1 -DatabaseProvider DYNAMODB
#>

param(
    [ValidateSet('PRISMA', 'DYNAMODB')]
    [string]$DatabaseProvider,
    
    [string]$BaseUrl,
    
    [switch]$SkipDelete
)

# Se BaseUrl não foi informado, ler PORT do .env
if (-not $BaseUrl) {
    $PORT = "4000"  # Default
    if (Test-Path ".env") {
        $portLine = Get-Content ".env" | Where-Object { $_ -match "^PORT\s*=\s*(\d+)" }
        if ($portLine -match "PORT\s*=\s*(\d+)") {
            $PORT = $matches[1]
        }
    }
    $BaseUrl = "http://localhost:$PORT"
    Write-Host "🔧 Usando porta do .env: $PORT" -ForegroundColor Cyan
}

# Prefixo e versionamento globais (NestJS)
$ApiPrefix = "/api/v1"

# ========================================
# 🎨 CONFIGURAÇÕES E CORES
# ========================================
$ErrorActionPreference = 'Continue'
$Green = 'Green'
$Red = 'Red'
$Yellow = 'Yellow'
$Cyan = 'Cyan'
$White = 'White'
$Magenta = 'Magenta'
$Gray = 'DarkGray'

# ========================================
# 🔍 DETECTAR DATABASE PROVIDER
# ========================================
if (-not $DatabaseProvider) {
    $envFile = ".env"
    if (Test-Path $envFile) {
        $envContent = Get-Content $envFile -ErrorAction SilentlyContinue
        foreach ($line in $envContent) {
            if ($line -match '^\s*DATABASE_PROVIDER\s*=\s*(.+)$') {
                $DatabaseProvider = $matches[1].Trim().Trim('"').Trim("'")
                break
            }
        }
    }
    
    if (-not $DatabaseProvider -and $env:DATABASE_PROVIDER) {
        $DatabaseProvider = $env:DATABASE_PROVIDER
    }
    
    if (-not $DatabaseProvider) {
        Write-Host "`n❌ ERRO: DATABASE_PROVIDER não encontrado!" -ForegroundColor $Red
        Write-Host "Configure DATABASE_PROVIDER no .env ou use: " -ForegroundColor $Yellow
        Write-Host ".\testar-todas-rotas-completo.ps1 -DatabaseProvider PRISMA`n" -ForegroundColor $Green
        exit 1
    }
}

# ========================================
# 📊 VARIÁVEIS GLOBAIS
# ========================================
$script:TotalTested = 0
$script:TotalSuccess = 0
$script:TotalFailed = 0

# IDs extraídos durante os testes
$script:UserID = $null
$script:Username = $null
$script:CategoryID = $null
$script:SubcategoryID = $null
$script:PostID = $null
$script:CommentID = $null
$script:BookmarkID = $null
$script:NotificationID = $null
$script:AccessToken = $null
$script:CognitoSub = $null
$script:Nickname = $null

# ========================================
# 🎯 FUNÇÕES AUXILIARES
# ========================================

function Write-Banner {
    param([string]$Title, [string]$Color = $Cyan)
    Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor $Color
    Write-Host "║  $($Title.PadRight(61))║" -ForegroundColor $Color
    Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor $Color
}

function Write-Section {
    param([string]$Emoji, [string]$Title)
    Write-Host "`n════════════════════════════════════════════════════════════════" -ForegroundColor $Cyan
    Write-Host "$Emoji $Title" -ForegroundColor $Cyan
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor $Cyan
}

function Invoke-ApiRequest {
    param(
        [string]$Method = "GET",
        [string]$Route,
        [string]$Description,
        [hashtable]$Body = $null,
        [bool]$Critical = $false
    )
    
    $script:TotalTested++
    
    Write-Host "`n[$script:TotalTested] 📍 $Method $Route" -ForegroundColor $Yellow
    Write-Host "    $Description" -ForegroundColor $White
    
    try {
        $headers = @{
            "X-Database-Provider" = $DatabaseProvider
            "Content-Type" = "application/json"
        }
        
        if ($script:AccessToken) {
            $headers["Authorization"] = "Bearer $script:AccessToken"
        }

        # Normaliza rota para sempre incluir /api/v1
        $routeToCall = $Route
        if ($routeToCall -match '^/api/v\d+/') {
            # já está versionado
        }
        elseif ($routeToCall -match '^/api/') {
            # tem /api mas sem versão -> troca para /api/v1
            $routeToCall = $routeToCall -replace '^/api', $ApiPrefix
        }
        else {
            # sem /api -> prefixa
            $routeToCall = "$ApiPrefix$routeToCall"
        }
        
        $params = @{
            Uri = "$BaseUrl$routeToCall"
            Method = $Method
            Headers = $headers
            UseBasicParsing = $true
            TimeoutSec = 15
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = $null
        $responseBody = $null

        try {
            $response = Invoke-WebRequest @params -ErrorAction Stop
            $responseBody = $response.Content
        }
        catch [System.Net.WebException] {
            $webResponse = $_.Exception.Response
            if ($webResponse) {
                try {
                    $statusCode = [int]$webResponse.StatusCode
                } catch {
                    $statusCode = 0
                }

                try {
                    $reader = New-Object System.IO.StreamReader($webResponse.GetResponseStream())
                    $responseBody = $reader.ReadToEnd()
                    $reader.Close()
                } catch {
                    $responseBody = $null
                }

                $response = [pscustomobject]@{
                    StatusCode = $statusCode
                    Content    = $responseBody
                }
            } else {
                throw
            }
        }
        
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
            Write-Host "    ✅ OK (Status: $($response.StatusCode))" -ForegroundColor $Green
            $script:TotalSuccess++
            
            # Tentar parsear JSON
            try {
                $jsonResponse = $responseBody | ConvertFrom-Json
                
                # Exibir resposta formatada (primeiras linhas)
                $contentPreview = ($responseBody | ConvertFrom-Json | ConvertTo-Json -Depth 3 -Compress)
                if ($contentPreview.Length -gt 200) {
                    $contentPreview = $contentPreview.Substring(0, 200) + "..."
                }
                Write-Host "    📄 $contentPreview" -ForegroundColor $Gray
                
                return @{
                    Success = $true
                    StatusCode = $response.StatusCode
                    Data = $jsonResponse
                }
            } catch {
                return @{
                    Success = $true
                    StatusCode = $response.StatusCode
                    Data = $responseBody
                }
            }
        }
        else {
            Write-Host "    ❌ FALHOU (Status: $($response.StatusCode))" -ForegroundColor $Red
            $script:TotalFailed++
            
            try {
                $errorContent = $responseBody | ConvertFrom-Json
                if ($errorContent.message) {
                    Write-Host "    💬 $($errorContent.message)" -ForegroundColor $Red
                }
            } catch {}
            
            if ($Critical) {
                Write-Host "`n⛔ TESTE CRÍTICO FALHOU! Abortando..." -ForegroundColor $Red
                exit 1
            }
            
            return @{
                Success = $false
                StatusCode = $response.StatusCode
                Data = $null
            }
        }
    }
    catch {
        Write-Host "    ❌ ERRO: $($_.Exception.Message)" -ForegroundColor $Red
        $script:TotalFailed++
        
        if ($Critical) {
            Write-Host "`n⛔ ERRO CRÍTICO! Verifique se o servidor está rodando:" -ForegroundColor $Red
            Write-Host "   pnpm run dev`n" -ForegroundColor $Green
            exit 1
        }
        
        return @{
            Success = $false
            StatusCode = 0
            Data = $null
            Error = $_.Exception.Message
        }
    }
}

# ========================================
# 🚀 INÍCIO DOS TESTES
# ========================================

Clear-Host
Write-Banner "🧪 TESTE COMPLETO DE TODAS AS ROTAS - BLOG API" $Cyan
Write-Host "`n📌 Configurações:" -ForegroundColor $White
Write-Host "   Base URL:  $BaseUrl" -ForegroundColor $White
Write-Host "   Database:  $DatabaseProvider" -ForegroundColor $(if ($DatabaseProvider -eq "PRISMA") { $Green } else { $Magenta })
Write-Host "   Ambiente:  $(if ($BaseUrl -match 'localhost') { 'LOCAL' } else { 'REMOTO' })" -ForegroundColor $Cyan
Write-Host ""

# ========================================
# ❤️ 1. HEALTH CHECK (CRÍTICO)
# ========================================
Write-Section "❤️" "1. HEALTH CHECK (OBRIGATÓRIO)"

$healthResult = Invoke-ApiRequest -Method GET -Route "/health" -Description "Health Check Básico" -Critical $true
$detailedResult = Invoke-ApiRequest -Method GET -Route "/health/detailed" -Description "Health Check Detalhado" -Critical $false

if ($healthResult.Success) {
    Write-Host "`n✅ API ESTÁ SAUDÁVEL! Continuando..." -ForegroundColor $Green
} else {
    Write-Host "`n❌ API NÃO ESTÁ RESPONDENDO! Execute: pnpm run dev" -ForegroundColor $Red
    exit 1
}

# ========================================
# 🔐 2. AUTENTICAÇÃO
# ========================================
Write-Section "🔐" "2. AUTENTICAÇÃO"

# Verificar disponibilidade de nickname
$randomNum = Get-Random -Maximum 99999
$checkNicknameBody = @{ nickname = "user$randomNum" }
Invoke-ApiRequest -Method POST -Route "/auth/check-nickname" -Description "Verificar Disponibilidade de Nickname" -Body $checkNicknameBody | Out-Null

# Verificar disponibilidade de nome
$checkFullNameBody = @{ fullName = "Usuario Teste $randomNum" }
Invoke-ApiRequest -Method POST -Route "/auth/check-fullName" -Description "Verificar Disponibilidade de Nome" -Body $checkFullNameBody | Out-Null

# Registrar usuário de teste
$registerBody = @{
    email = "teste$randomNum@example.com"
    password = "Senha123!@#"
    username = "user$randomNum"
    fullName = "Usuario Teste $randomNum"
}
$registerResult = Invoke-ApiRequest -Method POST -Route "/auth/register" -Description "Registrar Usuário" -Body $registerBody

if ($registerResult.Success -and $registerResult.Data) {
    $script:CognitoSub = $registerResult.Data.cognitoSub
    if ($script:CognitoSub) {
        Write-Host "    🔑 CognitoSub: $script:CognitoSub" -ForegroundColor $Cyan
    }
}

# Confirmar email (simulado - pode falhar se não houver código real)
$confirmEmailBody = @{
    email = $registerBody.email
    code = "123456"
}
Invoke-ApiRequest -Method POST -Route "/auth/confirm-email" -Description "Confirmar Email" -Body $confirmEmailBody | Out-Null

# Login
$loginBody = @{
    email = $registerBody.email
    password = $registerBody.password
}
$loginResult = Invoke-ApiRequest -Method POST -Route "/auth/login" -Description "Login" -Body $loginBody

if ($loginResult.Success -and $loginResult.Data) {
    $script:AccessToken = $loginResult.Data.accessToken
    if ($script:AccessToken) {
        Write-Host "    🔑 Token obtido com sucesso!" -ForegroundColor $Green
    }
}

# Refresh token
if ($loginResult.Success -and $loginResult.Data.refreshToken) {
    $refreshBody = @{ refreshToken = $loginResult.Data.refreshToken }
    Invoke-ApiRequest -Method POST -Route "/auth/refresh" -Description "Renovar Token" -Body $refreshBody | Out-Null
}

# Esqueci minha senha
$forgotBody = @{ email = $registerBody.email }
Invoke-ApiRequest -Method POST -Route "/auth/forgot-password" -Description "Esqueci Minha Senha" -Body $forgotBody | Out-Null

# Reenviar código de confirmação
$resendBody = @{ email = $registerBody.email }
Invoke-ApiRequest -Method POST -Route "/auth/resend-confirmation-code" -Description "Reenviar Código de Confirmação" -Body $resendBody | Out-Null

# Reset password (simulado)
$resetPasswordBody = @{
    email = $registerBody.email
    code = "123456"
    newPassword = "NovaSenha123!@#"
}
Invoke-ApiRequest -Method POST -Route "/auth/reset-password" -Description "Redefinir Senha" -Body $resetPasswordBody | Out-Null

# Change email (simulado)
$changeEmailBody = @{
    currentEmail = $registerBody.email
    newEmail = "novo$randomNum@example.com"
}
Invoke-ApiRequest -Method POST -Route "/auth/change-email" -Description "Alterar Email" -Body $changeEmailBody | Out-Null

# Verify email change (simulado)
$verifyEmailChangeBody = @{
    email = $registerBody.email
    code = "123456"
}
Invoke-ApiRequest -Method POST -Route "/auth/verify-email-change" -Description "Verificar Alteração de Email" -Body $verifyEmailChangeBody | Out-Null

# Verificar se precisa de nickname
if ($script:CognitoSub) {
    Invoke-ApiRequest -Method GET -Route "/auth/needs-nickname/$script:CognitoSub" -Description "Verifica se Usuário Precisa Escolher Nickname" | Out-Null
    
    # Change nickname
    $changeNicknameBody = @{
        cognitoSub = $script:CognitoSub
        nickname = "novo_nickname_$randomNum"
    }
    $changeNicknameResult = Invoke-ApiRequest -Method POST -Route "/auth/change-nickname" -Description "Altera o Nickname do Usuário" -Body $changeNicknameBody
    if ($changeNicknameResult.Success) {
        $script:Nickname = $changeNicknameBody.nickname
    }
}

# Verify email admin (simulado)
$verifyEmailAdminBody = @{
    email = $registerBody.email
    code = "123456"
}
Invoke-ApiRequest -Method POST -Route "/auth/verify-email-admin" -Description "Verificar E-mail Administrativamente" -Body $verifyEmailAdminBody | Out-Null

# OAuth - iniciar login (simulado)
Invoke-ApiRequest -Method GET -Route "/auth/oauth/google" -Description "Iniciar Login OAuth Google" | Out-Null

# OAuth callback (simulado)
$oauthCallbackBody = @{
    code = "oauth_code_123"
    state = "state_123"
}
Invoke-ApiRequest -Method POST -Route "/auth/oauth/google/callback" -Description "Processar Callback OAuth" -Body $oauthCallbackBody | Out-Null

# Passwordless - iniciar
$passwordlessInitBody = @{
    email = $registerBody.email
}
Invoke-ApiRequest -Method POST -Route "/auth/passwordless/init" -Description "Iniciar Autenticação Passwordless" -Body $passwordlessInitBody | Out-Null

# Passwordless - verificar
$passwordlessVerifyBody = @{
    email = $registerBody.email
    code = "123456"
}
Invoke-ApiRequest -Method POST -Route "/auth/passwordless/verify" -Description "Verificar Código Passwordless" -Body $passwordlessVerifyBody | Out-Null

# ========================================
# 👤 3. USUÁRIOS
# ========================================
Write-Section "👤" "3. USUÁRIOS (CRUD COMPLETO)"

# Criar usuário
$userBody = @{
    cognitoSub = "test-cognito-sub-$(Get-Random)"
    username = "rainer_dev_$(Get-Random -Maximum 9999)"
    email = "rainer_$(Get-Random)@example.com"
    fullName = "Rainer Developer"
    bio = "Desenvolvedor Full Stack"
    avatar = "https://example.com/avatar.jpg"
    role = "AUTHOR"
}
$userResult = Invoke-ApiRequest -Method POST -Route "/users" -Description "Criar Usuário" -Body $userBody

if ($userResult.Success -and $userResult.Data) {
    $script:UserID = $userResult.Data.id
    $script:Username = $userResult.Data.username
    Write-Host "    👤 UserID: $script:UserID" -ForegroundColor $Cyan
}

# Listar usuários
Invoke-ApiRequest -Method GET -Route "/users?page=1&limit=10" -Description "Listar Usuários" | Out-Null
Invoke-ApiRequest -Method GET -Route "/users?role=ADMIN" -Description "Filtrar por Role" | Out-Null

# Buscar por ID
if ($script:UserID) {
    Invoke-ApiRequest -Method GET -Route "/users/$script:UserID" -Description "Buscar Usuário por ID" | Out-Null
    
    # Atualizar usuário
    $updateUserBody = @{
        fullName = "Rainer Developer - ATUALIZADO"
        bio = "Desenvolvedor Full Stack Senior"
    }
    Invoke-ApiRequest -Method PUT -Route "/users/$script:UserID" -Description "Atualizar Usuário" -Body $updateUserBody | Out-Null
}

# Buscar por username
if ($script:Username) {
    Invoke-ApiRequest -Method GET -Route "/users/username/$script:Username" -Description "Buscar por Username" | Out-Null
}

# Buscar por Cognito Sub
if ($script:CognitoSub) {
    Invoke-ApiRequest -Method GET -Route "/users/cognito/$script:CognitoSub" -Description "Buscar por Cognito Sub" | Out-Null
}

# ========================================
# 🏷️ 4. CATEGORIAS E SUBCATEGORIAS
# ========================================
Write-Section "🏷️" "4. CATEGORIAS (CRUD COMPLETO)"

# Criar categoria principal
$categoryBody = @{
    fullName = "Tecnologia $(Get-Random -Maximum 999)"
    slug = "tecnologia-$(Get-Random -Maximum 999)"
    description = "Artigos sobre tecnologia e desenvolvimento"
}
$categoryResult = Invoke-ApiRequest -Method POST -Route "/categories" -Description "Criar Categoria" -Body $categoryBody

if ($categoryResult.Success -and $categoryResult.Data) {
    $script:CategoryID = $categoryResult.Data.id
    Write-Host "    🏷️ CategoryID: $script:CategoryID" -ForegroundColor $Cyan
}

# Criar subcategoria
if ($script:CategoryID) {
    $subcategoryBody = @{
        fullName = "JavaScript"
        slug = "javascript-$(Get-Random -Maximum 999)"
        description = "Artigos sobre JavaScript"
        parentId = $script:CategoryID
    }
    $subcategoryResult = Invoke-ApiRequest -Method POST -Route "/categories" -Description "Criar Subcategoria" -Body $subcategoryBody
    
    if ($subcategoryResult.Success -and $subcategoryResult.Data) {
        $script:SubcategoryID = $subcategoryResult.Data.id
        Write-Host "    📂 SubcategoryID: $script:SubcategoryID" -ForegroundColor $Cyan
    }
}

# Listar e buscar
Invoke-ApiRequest -Method GET -Route "/categories" -Description "Listar Categorias Principais" | Out-Null
Invoke-ApiRequest -Method GET -Route "/categories/subcategories/all" -Description "Listar Todas as Subcategorias" | Out-Null

if ($script:CategoryID) {
    Invoke-ApiRequest -Method GET -Route "/categories/$script:CategoryID" -Description "Buscar Categoria" | Out-Null
    Invoke-ApiRequest -Method GET -Route "/categories/$script:CategoryID/subcategories" -Description "Listar Subcategorias" | Out-Null
    Invoke-ApiRequest -Method GET -Route "/categories/slug/$($categoryBody.slug)" -Description "Buscar por Slug" | Out-Null
    
    # Atualizar categoria
    $updateCategoryBody = @{
        description = "Artigos sobre tecnologia, desenvolvimento e inovação"
    }
    Invoke-ApiRequest -Method PUT -Route "/categories/$script:CategoryID" -Description "Atualizar Categoria" -Body $updateCategoryBody | Out-Null
}

# ========================================
# 📄 5. POSTS
# ========================================
Write-Section "📄" "5. POSTS (CRUD COMPLETO)"

# Criar post
if ($script:UserID -and $script:SubcategoryID) {
    $postBody = @{
        title = "Guia Completo de NestJS - $(Get-Random -Maximum 999)"
        slug = "guia-nestjs-$(Get-Random -Maximum 999)"
        content = "NestJS é um framework progressivo para Node.js..."
        excerpt = "Aprenda tudo sobre NestJS neste guia completo"
        authorId = $script:UserID
        subcategoryId = $script:SubcategoryID
        featuredImage = "https://example.com/nestjs.jpg"
        published = $false
        tags = @("nestjs", "nodejs", "typescript")
    }
    $postResult = Invoke-ApiRequest -Method POST -Route "/posts" -Description "Criar Post (Rascunho)" -Body $postBody
    
    if ($postResult.Success -and $postResult.Data) {
        $script:PostID = $postResult.Data.id
        Write-Host "    📄 PostID: $script:PostID" -ForegroundColor $Cyan
    }
}

# Listar posts
Invoke-ApiRequest -Method GET -Route "/posts?page=1&limit=10" -Description "Listar Posts" | Out-Null
Invoke-ApiRequest -Method GET -Route "/posts?published=true" -Description "Posts Publicados" | Out-Null
Invoke-ApiRequest -Method GET -Route "/posts?published=false" -Description "Posts Rascunhos" | Out-Null

# Operações com post específico
if ($script:PostID) {
    Invoke-ApiRequest -Method GET -Route "/posts/$script:PostID" -Description "Buscar Post por ID" | Out-Null
    Invoke-ApiRequest -Method GET -Route "/posts/slug/$($postBody.slug)" -Description "Buscar Post por Slug" | Out-Null
    
    # Atualizar post
    $updatePostBody = @{
        title = "Guia Completo de NestJS - ATUALIZADO"
        content = "NestJS é um framework progressivo com TypeScript..."
    }
    Invoke-ApiRequest -Method PUT -Route "/posts/$script:PostID" -Description "Atualizar Post" -Body $updatePostBody | Out-Null
    
    # Publicar post
    Invoke-ApiRequest -Method PATCH -Route "/posts/$script:PostID/publish" -Description "Publicar Post" | Out-Null
    
    # Despublicar post
    Invoke-ApiRequest -Method PATCH -Route "/posts/$script:PostID/unpublish" -Description "Despublicar Post" | Out-Null
}

# Posts por autor e subcategoria
if ($script:UserID) {
    Invoke-ApiRequest -Method GET -Route "/posts/author/$script:UserID" -Description "Posts por Autor" | Out-Null
}
if ($script:SubcategoryID) {
    Invoke-ApiRequest -Method GET -Route "/posts/subcategory/$script:SubcategoryID" -Description "Posts por Subcategoria" | Out-Null
}

# ========================================
# 💬 6. COMENTÁRIOS
# ========================================
Write-Section "💬" "6. COMENTÁRIOS (CRUD COMPLETO)"

# Criar comentário
if ($script:PostID -and $script:UserID) {
    $commentBody = @{
        postId = $script:PostID
        authorId = $script:UserID
        content = "Excelente artigo! Muito bem explicado."
        approved = $false
    }
    $commentResult = Invoke-ApiRequest -Method POST -Route "/comments" -Description "Criar Comentário" -Body $commentBody
    
    if ($commentResult.Success -and $commentResult.Data) {
        $script:CommentID = $commentResult.Data.id
        Write-Host "    💬 CommentID: $script:CommentID" -ForegroundColor $Cyan
    }
}

# Listar e buscar comentários
Invoke-ApiRequest -Method GET -Route "/comments?limit=10" -Description "Listar Comentários" | Out-Null

if ($script:PostID) {
    Invoke-ApiRequest -Method GET -Route "/comments/post/$script:PostID" -Description "Comentários do Post" | Out-Null
}

if ($script:UserID) {
    Invoke-ApiRequest -Method GET -Route "/comments/user/$script:UserID" -Description "Comentários do Usuário" | Out-Null
}

# Operações com comentário específico
if ($script:CommentID) {
    Invoke-ApiRequest -Method GET -Route "/comments/$script:CommentID" -Description "Buscar Comentário" | Out-Null
    
    # Aprovar comentário
    Invoke-ApiRequest -Method PATCH -Route "/comments/$script:CommentID/approve" -Description "Aprovar Comentário" | Out-Null
    
    # Reprovar comentário
    Invoke-ApiRequest -Method PATCH -Route "/comments/$script:CommentID/disapprove" -Description "Reprovar Comentário" | Out-Null
    
    # Atualizar comentário
    $updateCommentBody = @{
        content = "Excelente artigo! Muito bem explicado e detalhado."
    }
    Invoke-ApiRequest -Method PUT -Route "/comments/$script:CommentID" -Description "Atualizar Comentário" -Body $updateCommentBody | Out-Null
}

# ========================================
# ❤️ 7. LIKES
# ========================================
Write-Section "❤️" "7. LIKES"

# Curtir post
if ($script:UserID -and $script:PostID) {
    $likeBody = @{
        userId = $script:UserID
        postId = $script:PostID
    }
    Invoke-ApiRequest -Method POST -Route "/likes" -Description "Curtir Post" -Body $likeBody | Out-Null
    
    # Verificar like
    Invoke-ApiRequest -Method GET -Route "/likes/$script:UserID/$script:PostID/check" -Description "Verificar Like" | Out-Null
}

# Estatísticas de likes
if ($script:PostID) {
    Invoke-ApiRequest -Method GET -Route "/likes/post/$script:PostID" -Description "Likes do Post" | Out-Null
    Invoke-ApiRequest -Method GET -Route "/likes/post/$script:PostID/count" -Description "Contar Likes" | Out-Null
}

if ($script:UserID) {
    Invoke-ApiRequest -Method GET -Route "/likes/user/$script:UserID" -Description "Likes do Usuário" | Out-Null
}

# ========================================
# 🔖 8. BOOKMARKS
# ========================================
Write-Section "🔖" "8. BOOKMARKS (FAVORITOS)"

# Salvar post
if ($script:UserID -and $script:PostID) {
    $bookmarkBody = @{
        userId = $script:UserID
        postId = $script:PostID
        collection = "Favoritos"
        notes = "Ler depois com atenção"
    }
    $bookmarkResult = Invoke-ApiRequest -Method POST -Route "/bookmarks" -Description "Salvar Post nos Favoritos" -Body $bookmarkBody
    
    if ($bookmarkResult.Success -and $bookmarkResult.Data) {
        $script:BookmarkID = $bookmarkResult.Data.id
        Write-Host "    🔖 BookmarkID: $script:BookmarkID" -ForegroundColor $Cyan
    }
}

# Listar bookmarks
if ($script:UserID) {
    Invoke-ApiRequest -Method GET -Route "/bookmarks/user/$script:UserID" -Description "Bookmarks do Usuário" | Out-Null
    Invoke-ApiRequest -Method GET -Route "/bookmarks/user/$script:UserID/collection?collection=Favoritos" -Description "Bookmarks por Coleção" | Out-Null
}

# Operações com bookmark específico
if ($script:BookmarkID) {
    Invoke-ApiRequest -Method GET -Route "/bookmarks/$script:BookmarkID" -Description "Buscar Bookmark" | Out-Null
    
    # Atualizar bookmark
    $updateBookmarkBody = @{
        notes = "Artigo muito importante, revisar conceitos"
    }
    Invoke-ApiRequest -Method PUT -Route "/bookmarks/$script:BookmarkID" -Description "Atualizar Bookmark" -Body $updateBookmarkBody | Out-Null
}

# Remover post dos favoritos
if ($script:UserID -and $script:PostID) {
    Invoke-ApiRequest -Method DELETE -Route "/bookmarks/user/$script:UserID/post/$script:PostID" -Description "Remover dos Favoritos" | Out-Null
}

# ========================================
# 🔔 9. NOTIFICAÇÕES
# ========================================
Write-Section "🔔" "9. NOTIFICAÇÕES"

# Criar notificação
if ($script:UserID -and $script:PostID) {
    $notificationBody = @{
        userId = $script:UserID
        type = "COMMENT"
        title = "Novo comentário"
        message = "Você recebeu um novo comentário no seu post"
        link = "/posts/$script:PostID"
        read = $false
    }
    $notificationResult = Invoke-ApiRequest -Method POST -Route "/notifications" -Description "Criar Notificação" -Body $notificationBody
    
    if ($notificationResult.Success -and $notificationResult.Data) {
        $script:NotificationID = $notificationResult.Data.id
        Write-Host "    🔔 NotificationID: $script:NotificationID" -ForegroundColor $Cyan
    }
}

# Listar notificações
if ($script:UserID) {
    Invoke-ApiRequest -Method GET -Route "/notifications/user/$script:UserID?page=1&limit=10" -Description "Notificações do Usuário" | Out-Null
    Invoke-ApiRequest -Method GET -Route "/notifications/user/$script:UserID/unread/count" -Description "Contar Não Lidas" | Out-Null
}

# Operações com notificação específica
if ($script:NotificationID) {
    Invoke-ApiRequest -Method GET -Route "/notifications/$script:NotificationID" -Description "Buscar Notificação" | Out-Null
    
    # Marcar como lida
    Invoke-ApiRequest -Method PATCH -Route "/notifications/$script:NotificationID/read" -Description "Marcar como Lida" | Out-Null
    
    # Atualizar notificação
    $updateNotificationBody = @{ read = $true }
    Invoke-ApiRequest -Method PUT -Route "/notifications/$script:NotificationID" -Description "Atualizar Notificação" -Body $updateNotificationBody | Out-Null
}

# Marcar todas como lidas
if ($script:UserID) {
    Invoke-ApiRequest -Method PATCH -Route "/notifications/user/$script:UserID/read-all" -Description "Marcar Todas como Lidas" | Out-Null
}

# ========================================
# 📸 10. CLOUDINARY
# ========================================
Write-Section "📸" "10. CLOUDINARY (UPLOAD DE IMAGENS)"

# Upload de imagem para blog (simulado - pode falhar sem arquivo real)
$blogImageBody = @{
    image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    folder = "blog"
}
Invoke-ApiRequest -Method POST -Route "/cloudinary/upload/blog-image" -Description "Upload de Imagem para Blog" -Body $blogImageBody | Out-Null

# Upload de avatar (simulado)
$avatarBody = @{
    image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    userId = $script:UserID
}
Invoke-ApiRequest -Method POST -Route "/cloudinary/upload/avatar" -Description "Upload de Avatar" -Body $avatarBody | Out-Null

# ========================================
# 📊 11. DASHBOARD
# ========================================
Write-Section "📊" "11. DASHBOARD"

# Estatísticas do dashboard
Invoke-ApiRequest -Method GET -Route "/api/dashboard/stats" -Description "Obter Estatísticas do Dashboard" | Out-Null

# Analytics do dashboard
Invoke-ApiRequest -Method GET -Route "/api/dashboard/analytics" -Description "Obter Analytics do Dashboard" | Out-Null

# ========================================
# 🗑️ 12. LIMPEZA (OPCIONAL)
# ========================================

if (-not $SkipDelete) {
    Write-Section "🗑️" "12. LIMPEZA DE DADOS DE TESTE (OPCIONAL)"
    
    Write-Host "`n⚠️  Deseja deletar os dados de teste criados? " -ForegroundColor $Yellow -NoNewline
    Write-Host "[S/N]: " -ForegroundColor $White -NoNewline
    $response = Read-Host
    
    if ($response -match '^[Ss]') {
        Write-Host "`n🗑️  Deletando dados de teste..." -ForegroundColor $Yellow
        
        # Deletar na ordem correta (dependências primeiro)
        if ($script:UserID -and $script:PostID) {
            Invoke-ApiRequest -Method DELETE -Route "/likes/$script:UserID/$script:PostID" -Description "Descurtir Post" | Out-Null
        }
        
        if ($script:BookmarkID) {
            Invoke-ApiRequest -Method DELETE -Route "/bookmarks/$script:BookmarkID" -Description "Deletar Bookmark" | Out-Null
        }
        
        if ($script:NotificationID) {
            Invoke-ApiRequest -Method DELETE -Route "/notifications/$script:NotificationID" -Description "Deletar Notificação" | Out-Null
        }
        
        if ($script:CommentID) {
            Invoke-ApiRequest -Method DELETE -Route "/comments/$script:CommentID" -Description "Deletar Comentário" | Out-Null
        }
        
        if ($script:PostID) {
            Invoke-ApiRequest -Method DELETE -Route "/posts/$script:PostID" -Description "Deletar Post" | Out-Null
        }
        
        if ($script:SubcategoryID) {
            Invoke-ApiRequest -Method DELETE -Route "/categories/$script:SubcategoryID" -Description "Deletar Subcategoria" | Out-Null
        }
        
        if ($script:CategoryID) {
            Invoke-ApiRequest -Method DELETE -Route "/categories/$script:CategoryID" -Description "Deletar Categoria" | Out-Null
        }
        
        if ($script:UserID) {
            Invoke-ApiRequest -Method DELETE -Route "/users/$script:UserID" -Description "Deletar Usuário" | Out-Null
        }
        
        Write-Host "`n✅ Limpeza concluída!" -ForegroundColor $Green
    } else {
        Write-Host "`n⏭️  Pulando limpeza de dados" -ForegroundColor $Gray
    }
} else {
    Write-Host "`n⏭️  Limpeza de dados desabilitada (--SkipDelete)" -ForegroundColor $Gray
}

# ========================================
# 📊 RELATÓRIO FINAL
# ========================================
Write-Banner "📊 RELATÓRIO FINAL" $Green

$successRate = if ($script:TotalTested -gt 0) { 
    [math]::Round(($script:TotalSuccess / $script:TotalTested) * 100, 2) 
} else { 
    0 
}

Write-Host "`n✅ TESTES CONCLUÍDOS COM SUCESSO!" -ForegroundColor $Green
Write-Host "`n📈 Estatísticas:" -ForegroundColor $Cyan
Write-Host "   Total de requisições:  $script:TotalTested" -ForegroundColor $White
Write-Host "   Requisições bem-sucedidas:  $script:TotalSuccess" -ForegroundColor $Green
Write-Host "   Requisições com falha:  $script:TotalFailed" -ForegroundColor $(if ($script:TotalFailed -eq 0) { $Green } else { $Red })
Write-Host "   Taxa de sucesso:  $successRate%" -ForegroundColor $(if ($successRate -ge 90) { $Green } elseif ($successRate -ge 70) { $Yellow } else { $Red })

Write-Host "`n🎯 IDs Gerados:" -ForegroundColor $Cyan
Write-Host "   CognitoSub:     $script:CognitoSub" -ForegroundColor $White
Write-Host "   UserID:         $script:UserID" -ForegroundColor $White
Write-Host "   Username:       $script:Username" -ForegroundColor $White
Write-Host "   Nickname:       $script:Nickname" -ForegroundColor $White
Write-Host "   CategoryID:     $script:CategoryID" -ForegroundColor $White
Write-Host "   SubcategoryID:  $script:SubcategoryID" -ForegroundColor $White
Write-Host "   PostID:         $script:PostID" -ForegroundColor $White
Write-Host "   CommentID:      $script:CommentID" -ForegroundColor $White
Write-Host "   BookmarkID:     $script:BookmarkID" -ForegroundColor $White
Write-Host "   NotificationID: $script:NotificationID" -ForegroundColor $White

Write-Host "`n🔗 Links Rápidos:" -ForegroundColor $Cyan
Write-Host "   API:     $BaseUrl" -ForegroundColor $White
Write-Host "   Swagger: $BaseUrl/docs" -ForegroundColor $White
Write-Host "   Health:  $BaseUrl/health" -ForegroundColor $White

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor $Green
Write-Host "✨ Todos os endpoints foram testados!" -ForegroundColor $Green
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor $Green

# Retornar código de saída apropriado
if ($script:TotalFailed -gt 0) {
    exit 1
} else {
    exit 0
}

