@echo off
setlocal enabledelayedexpansion
color 0A

echo ========================================
echo   HoraMed - Gerador de Keystore
echo ========================================

set KEYSTORE_PATH=android\keystore\horamed-release.keystore
set ALIAS=horamed-key

if exist "!KEYSTORE_PATH!" (
    echo [AVISO] O arquivo keystore ja existe em !KEYSTORE_PATH!
    echo Se voce criar um novo, o antigo sera sobrescrito.
    set /p confirmar="Deseja continuar? (s/n): "
    if /i "!confirmar!" neq "s" exit /b 0
)

echo.
echo Digite uma senha forte para o Keystore (minimo 6 caracteres):
set /p PASSWORD="> "

if "!PASSWORD!"=="" (
    echo [ERRO] Senha nao pode ser vazia.
    pause
    exit /b 1
)

echo.
echo Gerando Keystore...
keytool -genkeypair -v -storetype PKCS12 -keystore !KEYSTORE_PATH! -alias !ALIAS! -keyalg RSA -keysize 2048 -validity 10000 -storepass !PASSWORD! -keypass !PASSWORD! -dname "CN=HoraMed, OU=Mobile, O=HoraMed, L=Sao Luis, ST=Maranhao, C=BR"

if !errorlevel! equ 0 (
    echo.
    echo ================================================
    echo [SUCESSO] Keystore gerado com sucesso!
    echo ================================================
    echo Arquivo: !KEYSTORE_PATH!
    echo Alias: !ALIAS!
    echo Senha: !PASSWORD!
    echo.
    echo ⚠️ SALVE ESTA SENHA EM UM LOCAL SEGURO!
    echo ⚠️ FACA BACKUP DO ARQUIVO .KEYSTORE!
    echo.
    
    echo Adicionando variavel de ambiente temporaria para o build atual...
    setx HORAMED_KEYSTORE_PASSWORD "!PASSWORD!"
    
    echo.
    echo Agora voce pode rodar o build:
    echo cd android ^&^& gradlew.bat bundleRelease
) else (
    echo [ERRO] Falha ao gerar keystore. Verifique se o 'keytool' (do Java) esta no seu PATH.
)

pause
