# ============================================================
# HoraMed — Build AAB + Deploy Firebase
# Execute na raiz do projeto: .\build-release.ps1
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HoraMed Release Builder v1.0.33" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------
# PASSO 1 — Senha do keystore
# ------------------------------------------------------------
Write-Host "[1/6] Verificando senha do keystore..." -ForegroundColor Yellow

if (-not $env:HORAMED_KEYSTORE_PASSWORD) {
    $senha = Read-Host "Digite a senha do keystore (android/keystore/horamed-release.keystore)"
    $env:HORAMED_KEYSTORE_PASSWORD = $senha
}

Write-Host "      Senha configurada." -ForegroundColor Green

# ------------------------------------------------------------
# PASSO 2 — Localizar o Android SDK automaticamente
# ------------------------------------------------------------
Write-Host "[2/6] Localizando Android SDK..." -ForegroundColor Yellow

$sdkCandidates = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk",
    "C:\Android\Sdk",
    "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
)

$sdkDir = $null
foreach ($candidate in $sdkCandidates) {
    if (Test-Path $candidate) {
        $sdkDir = $candidate
        break
    }
}

if (-not $sdkDir) {
    if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) {
        $sdkDir = $env:ANDROID_HOME
    } elseif ($env:ANDROID_SDK_ROOT -and (Test-Path $env:ANDROID_SDK_ROOT)) {
        $sdkDir = $env:ANDROID_SDK_ROOT
    }
}

if (-not $sdkDir) {
    Write-Host ""
    Write-Host "ERRO: Android SDK nao encontrado." -ForegroundColor Red
    Write-Host ""
    Write-Host "Instale o Android Studio em https://developer.android.com/studio" -ForegroundColor Yellow
    Write-Host "Ou defina manualmente: " -ForegroundColor Yellow
    Write-Host '  $env:ANDROID_HOME = "C:\caminho\para\Android\Sdk"' -ForegroundColor White
    exit 1
}

Write-Host "      SDK encontrado em: $sdkDir" -ForegroundColor Green

# Criar/atualizar local.properties com o caminho correto
$sdkDirFormatted = $sdkDir -replace "\\", "/"
$localProps = "android\local.properties"
"sdk.dir=$sdkDirFormatted" | Set-Content $localProps -Encoding ASCII
Write-Host "      android\local.properties atualizado." -ForegroundColor Green

# ------------------------------------------------------------
# PASSO 3 — Build do web app
# ------------------------------------------------------------
Write-Host "[3/6] Compilando web app (npm run build)..." -ForegroundColor Yellow

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO no build do web app." -ForegroundColor Red
    exit 1
}

Write-Host "      Web app compilado." -ForegroundColor Green

# ------------------------------------------------------------
# PASSO 4 — Sync Capacitor
# ------------------------------------------------------------
Write-Host "[4/6] Sincronizando com Android (cap sync)..." -ForegroundColor Yellow

npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO no cap sync." -ForegroundColor Red
    exit 1
}

Write-Host "      Sincronizado." -ForegroundColor Green

# ------------------------------------------------------------
# PASSO 5 — Build do AAB
# ------------------------------------------------------------
Write-Host "[5/6] Gerando AAB release (pode demorar 3-5 min)..." -ForegroundColor Yellow

Set-Location android
.\gradlew.bat bundleRelease
$gradleResult = $LASTEXITCODE
Set-Location ..

if ($gradleResult -ne 0) {
    Write-Host "ERRO no build do AAB." -ForegroundColor Red
    exit 1
}

$aabPath = "android\app\build\outputs\bundle\release\app-release.aab"
if (Test-Path $aabPath) {
    $size = [math]::Round((Get-Item $aabPath).Length / 1MB, 1)
    Write-Host "      AAB gerado: $aabPath ($size MB)" -ForegroundColor Green
} else {
    Write-Host "AVISO: AAB nao encontrado no caminho esperado." -ForegroundColor Yellow
}

# ------------------------------------------------------------
# PASSO 6 — Deploy Firebase Hosting
# ------------------------------------------------------------
Write-Host "[6/6] Fazendo deploy no Firebase Hosting..." -ForegroundColor Yellow

$firebaseCheck = firebase --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "AVISO: Firebase CLI nao encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g firebase-tools
}

firebase deploy --only hosting --project horamed-firebase
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERRO no deploy. Voce precisa fazer login primeiro:" -ForegroundColor Red
    Write-Host "  firebase login" -ForegroundColor White
    Write-Host "Depois execute o script novamente." -ForegroundColor Yellow
    exit 1
}

# ------------------------------------------------------------
# CONCLUIDO
# ------------------------------------------------------------
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  BUILD E DEPLOY CONCLUIDOS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "AAB para o Google Play:" -ForegroundColor Cyan
Write-Host "  android\app\build\outputs\bundle\release\app-release.aab" -ForegroundColor White
Write-Host ""
Write-Host "PWA publicada em:" -ForegroundColor Cyan
Write-Host "  https://horamed-firebase.web.app" -ForegroundColor White
Write-Host ""
