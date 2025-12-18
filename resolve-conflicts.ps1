# Script para resolver conflitos de merge mantendo a versão HEAD
$files = Get-ChildItem -Path ".\src\" -Recurse -Include *.ts
$totalFiles = 0
$resolvedFiles = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    if ($content -match "<<<<<<<") {
        $totalFiles++
        Write-Host "Resolvendo conflitos em: $($file.FullName)"
        
        # Remove marcadores de conflito mantendo a versão HEAD
        $cleanContent = $content -replace '(?s)<<<<<<< HEAD\r?\n(.*?)\r?\n=======\r?\n(.*?)\r?\n>>>>>>> [0-9a-f]+\r?\n', ''
        
        # Salva o arquivo limpo
        $cleanContent | Set-Content -Path $file.FullName -Encoding UTF8 -NoNewline
        $resolvedFiles++
    }
}

Write-Host "
Conflitos resolvidos: $resolvedFiles de $totalFiles arquivos"
