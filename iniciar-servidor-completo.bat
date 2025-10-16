@echo off
cls
echo ════════════════════════════════════════════════════════════
echo   INICIANDO SERVIDOR COMPLETO - BLOG API
echo ════════════════════════════════════════════════════════════
echo.

echo [1/5] Verificando MongoDB...
docker-compose up -d mongodb
if %errorlevel% neq 0 (
    echo ERRO: Falha ao iniciar MongoDB
    pause
    exit /b 1
)
timeout /t 2 >nul

echo.
echo [2/5] Gerando Prisma Client...
call npx -y prisma@latest generate --schema=src/prisma/schema.prisma

echo.
echo [3/5] Sincronizando schema com MongoDB...
call npx -y prisma@latest db push --schema=src/prisma/schema.prisma --skip-generate --accept-data-loss

echo.
echo [4/5] Populando banco de dados...
call node seed-simplificado.cjs

echo.
echo [5/5] Iniciando servidor na porta 4000...
echo.
echo ════════════════════════════════════════════════════════════
echo   SERVIDOR RODANDO
echo ════════════════════════════════════════════════════════════
echo.
echo  API:            http://localhost:4000
echo  Swagger:        http://localhost:4000/docs
echo  Health Check:   http://localhost:4000/health
echo  Prisma Studio:  http://localhost:5555
echo.
echo  Endpoint PATCH: http://localhost:4000/api/posts/:slug
echo.
echo ════════════════════════════════════════════════════════════
echo.
echo Pressione CTRL+C para parar o servidor
echo.

npm run dev

