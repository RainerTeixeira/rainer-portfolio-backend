# Script completo para testar todas as rotas da API

Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   TESTANDO TODAS AS ROTAS - BLOG API NESTJS + FASTIFY   ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:4000"
$results = @{}
$passCount = 0
$failCount = 0

function Test-Route {
    param(
        [string]$Method,
        [string]$Path,
        [string]$Description
    )
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$Path" -Method $Method -UseBasicParsing -TimeoutSec 5
        Write-Host "  ✅ $Description" -ForegroundColor Green
        Write-Host "     $Method $Path - Status: $($response.StatusCode)" -ForegroundColor Gray
        $script:passCount++
        $results[$Description] = "✅ PASSOU"
        return $true
    }
    catch {
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "  ❌ $Description" -ForegroundColor Red
            Write-Host "     $Method $Path - Status: $statusCode" -ForegroundColor Gray
        } else {
            Write-Host "  ❌ $Description - ERRO: $($_.Exception.Message)" -ForegroundColor Red
        }
        $script:failCount++
        $results[$Description] = "❌ FALHOU"
        return $false
    }
}

# ═══════════════════════════════════════════════════════════
# 1. HEALTH CHECK & MONITORING
# ═══════════════════════════════════════════════════════════
Write-Host "`n💚 [1/9] HEALTH CHECK & MONITORING" -ForegroundColor Green
Write-Host "════════════════════════════════════════════`n" -ForegroundColor DarkGray

Test-Route -Method "GET" -Path "/health" -Description "Health Check Básico"
Test-Route -Method "GET" -Path "/health/detailed" -Description "Health Check Detalhado"

# ═══════════════════════════════════════════════════════════
# 2. SWAGGER DOCUMENTATION
# ═══════════════════════════════════════════════════════════
Write-Host "`n📚 [2/9] SWAGGER DOCUMENTATION" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════`n" -ForegroundColor DarkGray

Test-Route -Method "GET" -Path "/docs" -Description "Swagger UI"
Test-Route -Method "GET" -Path "/docs-json" -Description "Swagger JSON"

# ═══════════════════════════════════════════════════════════
# 3. USERS (Usuários)
# ═══════════════════════════════════════════════════════════
Write-Host "`n👤 [3/9] USERS (Usuários)" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════`n" -ForegroundColor DarkGray

Test-Route -Method "GET" -Path "/users" -Description "Listar Usuários"
Test-Route -Method "GET" -Path "/users?page=1&limit=10" -Description "Listar Usuários (paginado)"
Test-Route -Method "GET" -Path "/users?role=ADMIN" -Description "Filtrar por Role"

# ═══════════════════════════════════════════════════════════
# 4. POSTS (Artigos)
# ═══════════════════════════════════════════════════════════
Write-Host "`n📄 [4/9] POSTS (Artigos)" -ForegroundColor Blue
Write-Host "════════════════════════════════════════════`n" -ForegroundColor DarkGray

Test-Route -Method "GET" -Path "/posts" -Description "Listar Posts"
Test-Route -Method "GET" -Path "/posts?status=PUBLISHED" -Description "Listar Posts Publicados"
Test-Route -Method "GET" -Path "/posts?status=DRAFT" -Description "Listar Rascunhos"
Test-Route -Method "GET" -Path "/posts?featured=true" -Description "Posts em Destaque"
Test-Route -Method "GET" -Path "/posts?page=1&limit=5" -Description "Posts (paginado)"

# ═══════════════════════════════════════════════════════════
# 5. CATEGORIES (Categorias)
# ═══════════════════════════════════════════════════════════
Write-Host "`n🏷️  [5/9] CATEGORIES (Categorias)" -ForegroundColor Magenta
Write-Host "════════════════════════════════════════════`n" -ForegroundColor DarkGray

Test-Route -Method "GET" -Path "/categories" -Description "Listar Categorias Principais"

# ═══════════════════════════════════════════════════════════
# RESUMO FINAL
# ═══════════════════════════════════════════════════════════
Write-Host "`n`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor White
Write-Host "║                  📊 RESUMO DOS TESTES                     ║" -ForegroundColor White
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor White

$total = $passCount + $failCount
$successRate = if ($total -gt 0) { [math]::Round(($passCount / $total) * 100, 2) } else { 0 }

Write-Host "  Total de Testes:    $total" -ForegroundColor White
Write-Host "  ✅ Passou:          $passCount" -ForegroundColor Green
Write-Host "  ❌ Falhou:          $failCount" -ForegroundColor Red
Write-Host "  📈 Taxa de Sucesso: $successRate%" -ForegroundColor $(if($successRate -ge 80){"Green"}elseif($successRate -ge 50){"Yellow"}else{"Red"})

if ($failCount -eq 0) {
    Write-Host "`n  🎉🎉🎉 TODOS OS TESTES PASSARAM! 🎉🎉🎉" -ForegroundColor Green -BackgroundColor DarkGreen
    Write-Host "`n  ✨ A API está 100% funcional!`n" -ForegroundColor Green
} elseif ($passCount -gt $failCount) {
    Write-Host "`n  ⚠️  MAIORIA DOS TESTES PASSOU ($passCount/$total)" -ForegroundColor Yellow
} else {
    Write-Host "`n  ❌ MUITOS TESTES FALHARAM ($failCount/$total)" -ForegroundColor Red
}

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "`n📌 Acesse:" -ForegroundColor Cyan
Write-Host "   🌐 API:     http://localhost:4000" -ForegroundColor White
Write-Host "   📚 Swagger: http://localhost:4000/docs" -ForegroundColor White
Write-Host "   💚 Health:  http://localhost:4000/health`n" -ForegroundColor White
