#!/usr/bin/env pwsh
# Script para configurar Stripe em modo de produção
# Execute: .\setup-stripe-production.ps1

Write-Host "🚀 Configuração do Stripe para Produção" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "firebase.json")) {
    Write-Host "❌ Erro: Execute este script na raiz do projeto (onde está o firebase.json)" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Este script irá configurar as variáveis de ambiente do Firebase Functions" -ForegroundColor Yellow
Write-Host ""

# Solicitar chave secreta do Stripe
Write-Host "1️⃣  Chave Secreta do Stripe (Live)" -ForegroundColor Green
Write-Host "   Acesse: https://dashboard.stripe.com/apikeys" -ForegroundColor Gray
$stripeSecretKey = Read-Host "   Cole a chave secreta (sk_live_...)"

if (-not $stripeSecretKey.StartsWith("sk_live_")) {
    Write-Host "⚠️  Aviso: A chave não começa com 'sk_live_'. Tem certeza que é a chave de produção?" -ForegroundColor Yellow
    $confirm = Read-Host "   Continuar mesmo assim? (s/N)"
    if ($confirm -ne "s") {
        Write-Host "❌ Operação cancelada" -ForegroundColor Red
        exit 1
    }
}

# Solicitar webhook secret
Write-Host ""
Write-Host "2️⃣  Webhook Secret (Live)" -ForegroundColor Green
Write-Host "   Acesse: https://dashboard.stripe.com/webhooks" -ForegroundColor Gray
Write-Host "   URL do webhook: https://us-central1-horamed-firebase.cloudfunctions.net/stripeWebhook" -ForegroundColor Gray
$webhookSecret = Read-Host "   Cole o webhook secret (whsec_...)"

if (-not $webhookSecret.StartsWith("whsec_")) {
    Write-Host "⚠️  Aviso: O secret não começa com 'whsec_'. Verifique se copiou corretamente." -ForegroundColor Yellow
    $confirm = Read-Host "   Continuar mesmo assim? (s/N)"
    if ($confirm -ne "s") {
        Write-Host "❌ Operação cancelada" -ForegroundColor Red
        exit 1
    }
}

# Solicitar Price IDs
Write-Host ""
Write-Host "3️⃣  Price IDs (Live)" -ForegroundColor Green
Write-Host "   Acesse: https://dashboard.stripe.com/products" -ForegroundColor Gray
Write-Host ""
Write-Host "   BRL (Brasil):" -ForegroundColor Cyan
$priceBrlMonthly = Read-Host "   Price ID Mensal (R$ 19,90/mês)"
$priceBrlAnnual = Read-Host "   Price ID Anual (R$ 199,90/ano)"
Write-Host ""
Write-Host "   USD (Internacional):" -ForegroundColor Cyan
$priceUsdMonthly = Read-Host "   Price ID Mensal ($3.99/mês)"
$priceUsdAnnual = Read-Host "   Price ID Anual ($39.99/ano)"

# Confirmação
Write-Host ""
Write-Host "📝 Resumo da Configuração:" -ForegroundColor Yellow
Write-Host "   Stripe Secret: $($stripeSecretKey.Substring(0, 15))..." -ForegroundColor Gray
Write-Host "   Webhook Secret: $($webhookSecret.Substring(0, 15))..." -ForegroundColor Gray
Write-Host "   BRL Monthly: $priceBrlMonthly" -ForegroundColor Gray
Write-Host "   BRL Annual: $priceBrlAnnual" -ForegroundColor Gray
Write-Host "   USD Monthly: $priceUsdMonthly" -ForegroundColor Gray
Write-Host "   USD Annual: $priceUsdAnnual" -ForegroundColor Gray
Write-Host ""
$confirm = Read-Host "Confirmar e aplicar configuração? (s/N)"

if ($confirm -ne "s") {
    Write-Host "❌ Operação cancelada" -ForegroundColor Red
    exit 1
}

# Configurar Firebase Functions
Write-Host ""
Write-Host "⚙️  Configurando Firebase Functions..." -ForegroundColor Cyan

try {
    # Configurar Stripe
    firebase functions:config:set "stripe.secret_key=$stripeSecretKey" 2>&1 | Out-Null
    Write-Host "✅ Stripe secret key configurada" -ForegroundColor Green
    
    firebase functions:config:set "stripe.webhook_secret=$webhookSecret" 2>&1 | Out-Null
    Write-Host "✅ Webhook secret configurado" -ForegroundColor Green
    
    # Atualizar Price IDs no código
    Write-Host ""
    Write-Host "📝 Atualizando Price IDs no código..." -ForegroundColor Cyan
    
    $indexPath = "functions\src\index.ts"
    $content = Get-Content $indexPath -Raw
    
    # Substituir Price IDs
    $content = $content -replace "monthly: 'price_1SvP3bHh4P8HSV4Y7Mrv5t2y'", "monthly: '$priceBrlMonthly'"
    $content = $content -replace "annual: 'price_1SvP45Hh4P8HSV4Y2DYbc4Gr'", "annual: '$priceBrlAnnual'"
    $content = $content -replace "monthly: 'price_1SvxqlHh4P8HSV4YpZKzGawy'", "monthly: '$priceUsdMonthly'"
    $content = $content -replace "annual: 'price_1SvxrIHh4P8HSV4YCGnYC8Mn'", "annual: '$priceUsdAnnual'"
    
    # Remover comentários "(Test Mode)"
    $content = $content -replace " \(Test Mode\)", " (Live Mode)"
    
    Set-Content $indexPath $content -NoNewline
    Write-Host "✅ Price IDs atualizados" -ForegroundColor Green
    
    # Verificar configuração
    Write-Host ""
    Write-Host "🔍 Verificando configuração..." -ForegroundColor Cyan
    firebase functions:config:get
    
    Write-Host ""
    Write-Host "✅ Configuração concluída com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 Próximos passos:" -ForegroundColor Yellow
    Write-Host "   1. cd functions" -ForegroundColor Gray
    Write-Host "   2. npm run build" -ForegroundColor Gray
    Write-Host "   3. cd .." -ForegroundColor Gray
    Write-Host "   4. firebase deploy --only functions" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Teste com um cartão real após o deploy!" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Erro ao configurar: $_" -ForegroundColor Red
    exit 1
}
