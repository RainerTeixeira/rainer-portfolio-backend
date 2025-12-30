#!/usr/bin/env pwsh
# Script para testar endpoints SAM local

Write-Host "🧪 Testando endpoints SAM Local" -ForegroundColor Cyan

$baseUrl = "http://localhost:4000"

# Teste 1: Health Check
Write-Host "`n1️⃣  Testando /health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ Health check OK" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Erro no health check: $_" -ForegroundColor Red
}

# Teste 2: Health Check API v1
Write-Host "`n2️⃣  Testando /api/v1/health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/health" -Method Get
    Write-Host "✅ API v1 health check OK" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Erro no API v1 health check: $_" -ForegroundColor Red
}

# Teste 3: Listar Posts
Write-Host "`n3️⃣  Testando /api/v1/posts..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/posts" -Method Get
    Write-Host "✅ Listagem de posts OK" -ForegroundColor Green
    Write-Host "Total de posts: $($response.data.items.Count)" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Erro ao listar posts: $_" -ForegroundColor Red
}

Write-Host "`n✅ Testes concluídos!" -ForegroundColor Green
