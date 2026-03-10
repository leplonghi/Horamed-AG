@echo off
title HoraMed - Gerando AAB para Google Play
color 0A

echo ============================================
echo   HoraMed - Build AAB para Google Play
echo ============================================
echo.

:: Senha do keystore
set HORAMED_KEYSTORE_PASSWORD=Gringo08!

:: Detectar Android SDK (Android Studio instala aqui por padrao no Windows)
if "%ANDROID_HOME%"=="" (
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
    ) else if exist "%USERPROFILE%\AppData\Local\Android\Sdk" (
        set ANDROID_HOME=%USERPROFILE%\AppData\Local\Android\Sdk
    ) else (
        echo [ERRO] Android SDK nao encontrado.
        echo Instale o Android Studio: https://developer.android.com/studio
        pause
        exit /b 1
    )
)
echo Android SDK: %ANDROID_HOME%
echo.

:: Criar .env com credenciais Firebase
echo [1/5] Configurando credenciais Firebase...
(
echo VITE_FIREBASE_API_KEY="AIzaSyAeEHqEKubTYTZboROg71VOYq_1WqoRjck"
echo VITE_FIREBASE_AUTH_DOMAIN="horamed-firebase.firebaseapp.com"
echo VITE_FIREBASE_PROJECT_ID="horamed-firebase"
echo VITE_FIREBASE_STORAGE_BUCKET="horamed-firebase.firebasestorage.app"
echo VITE_FIREBASE_MESSAGING_SENDER_ID="299174581868"
echo VITE_FIREBASE_APP_ID="1:299174581868:web:8f12e40d915f5d9e956a49"
echo VITE_FIREBASE_MEASUREMENT_ID="G-4JLQ2SGXSE"
) > .env
echo OK.
echo.

:: Instalar dependencias
echo [2/5] Instalando dependencias npm...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo [ERRO] Falha no npm install. Verifique se o Node.js esta instalado.
    goto :error
)
echo.

:: Build web
echo [3/5] Gerando build web (Vite)...
call npm run build
if errorlevel 1 (
    echo [ERRO] Falha no build web.
    goto :error
)
echo.

:: Sincronizar assets com Android
echo [4/5] Sincronizando assets com Android (Capacitor)...
call npx cap sync android
if errorlevel 1 (
    echo [ERRO] Falha no cap sync.
    goto :error
)
echo.

:: Gerar AAB
echo [5/5] Gerando AAB (pode demorar 5-10 min)...
cd android
call gradlew.bat bundleRelease --no-daemon
if errorlevel 1 (
    cd ..
    echo [ERRO] Falha no build Android.
    goto :error
)
cd ..
echo.

:: Sucesso
set AAB_PATH=%~dp0android\app\build\outputs\bundle\release\app-release.aab
echo ============================================
echo   AAB GERADO COM SUCESSO!
echo ============================================
echo.
echo Arquivo: %AAB_PATH%
echo.
echo Abrindo pasta no Windows Explorer...
explorer "%~dp0android\app\build\outputs\bundle\release"
echo.
echo Faca o upload do app-release.aab no Google Play Console.
pause
exit /b 0

:error
echo.
echo ============================================
echo   BUILD FALHOU - veja o erro acima
echo ============================================
pause
exit /b 1
