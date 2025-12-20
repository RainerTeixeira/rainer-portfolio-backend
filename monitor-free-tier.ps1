# Monitor Free Tier AWS - Evita custos
# Monitora uso dos recursos para manter dentro do Free Tier

Write-Host "📊 AWS Free Tier Monitor" -ForegroundColor Green

# Comandos para monitorar uso
Write-Host "🔍 Comandos de monitoramento:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. DynamoDB Usage:"
Write-Host "aws dynamodb describe-table --table-name rainer-portfolio-backend-prod-users --query 'Table.ProvisionedThroughput'"
Write-Host ""
Write-Host "2. Lambda Invocations (último mês):"
Write-Host "aws logs describe-log-groups --log-group-name-prefix '/aws/lambda/rainer-portfolio'"
Write-Host ""
Write-Host "3. CloudWatch Logs Usage:"
Write-Host "aws logs describe-log-groups --query 'logGroups[].storedBytes' --output table"
Write-Host ""
Write-Host "4. Billing Dashboard:"
Write-Host "https://console.aws.amazon.com/billing/home#/freetier"
Write-Host ""
Write-Host "⚠️ LIMITES FREE TIER:" -ForegroundColor Red
Write-Host "• DynamoDB: 25 RCU + 25 WCU"
Write-Host "• Lambda: 1M requests + 400k GB-segundos/mês"
Write-Host "• CloudWatch: 5GB logs/mês"
Write-Host "• Cognito: 50k MAU/mês"