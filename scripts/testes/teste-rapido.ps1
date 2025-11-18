# Teste Rapido de Rotas
$baseUrl = "http://localhost:4000"
$success = 0
$failed = 0

Write-Host "Testando rotas da API..." -ForegroundColor Cyan

$routes = @(
    @{Route="/health"; Name="Health Check"},
    @{Route="/health/detailed"; Name="Health Detailed"},
    @{Route="/users?page=1&limit=5"; Name="List Users"},
    @{Route="/categories"; Name="List Categories"},
    @{Route="/posts?page=1&limit=5"; Name="List Posts"},
    @{Route="/comments?limit=5"; Name="List Comments"}
)

foreach ($test in $routes) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$($test.Route)" -UseBasicParsing -Headers @{"X-Database-Provider"="PRISMA"} -TimeoutSec 5
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
            Write-Host "OK - $($test.Name) (Status: $($response.StatusCode))" -ForegroundColor Green
            $success++
        } else {
            Write-Host "FAIL - $($test.Name) (Status: $($response.StatusCode))" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "ERROR - $($test.Name): $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`nResultado: $success sucesso, $failed falhas" -ForegroundColor Cyan

